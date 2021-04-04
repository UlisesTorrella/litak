package lila.game

import chess._
import chess.format.Uci
import chess.variant.Variant
import org.joda.time.DateTime
import org.lichess.compression.clock.{ Encoder => ClockEncoder }
import scala.util.Try
import scala.collection.mutable.Stack
import lila.db.ByteArray

object BinaryFormat {

  object pgn {

    def write(moves: PgnMoves): ByteArray = {
      ByteArray {
        format.pgn.Binary.writeMoves(moves).get
      }
    }

    def read(ba: ByteArray): PgnMoves = {
      format.pgn.Binary.readMoves(ba.value.toList).get.toVector
    }
    def read(ba: ByteArray, nb: Int): PgnMoves = {
      format.pgn.Binary.readMoves(ba.value.toList, nb).get.toVector
    }
  }

  object clockHistory {
    private val logger = lila.log("clockHistory")

    def writeSide(start: Centis, times: Vector[Centis], flagged: Boolean) = {
      val timesToWrite = if (flagged) times.dropRight(1) else times
      ByteArray(ClockEncoder.encode(timesToWrite.view.map(_.centis).to(Array), start.centis))
    }

    def readSide(start: Centis, ba: ByteArray, flagged: Boolean) = {
      val decoded: Vector[Centis] =
        ClockEncoder.decode(ba.value, start.centis).view.map(Centis.apply).to(Vector)
      if (flagged) decoded :+ Centis(0) else decoded
    }

    def read(start: Centis, bw: ByteArray, bb: ByteArray, flagged: Option[Color]) =
      Try {
        ClockHistory(
          readSide(start, bw, flagged has White),
          readSide(start, bb, flagged has Black)
        )
      }.fold(
        e => { logger.warn(s"Exception decoding history", e); none },
        some
      )
  }

  object moveTime {

    private type MT = Int // centiseconds
    private val size = 16
    private val buckets =
      List(10, 50, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000)
    private val encodeCutoffs = buckets zip buckets.tail map { case (i1, i2) =>
      (i1 + i2) / 2
    } toVector

    private val decodeMap: Map[Int, MT] = buckets.view.zipWithIndex.map(x => x._2 -> x._1).toMap

    def write(mts: Vector[Centis]): ByteArray = {
      def enc(mt: Centis) = encodeCutoffs.search(mt.centis).insertionPoint
      mts
        .grouped(2)
        .map {
          case Vector(a, b) => (enc(a) << 4) + enc(b)
          case Vector(a)    => enc(a) << 4
          case v            => sys error s"moveTime.write unexpected $v"
        }
        .map(_.toByte)
        .toArray
    }

    def read(ba: ByteArray, turns: Int): Vector[Centis] = {
      def dec(x: Int) = decodeMap.getOrElse(x, decodeMap(size - 1))
      ba.value map toInt flatMap { k =>
        Array(dec(k >> 4), dec(k & 15))
      }
    }.view.take(turns).map(Centis.apply).toVector
  }

  case class clock(start: Timestamp) {

    def legacyElapsed(clock: Clock, color: Color) =
      clock.limit - clock.players(color).remaining

    def computeRemaining(config: Clock.Config, legacyElapsed: Centis) =
      config.limit - legacyElapsed

    def write(clock: Clock): ByteArray = {
      Array(writeClockLimit(clock.limitSeconds), clock.incrementSeconds.toByte) ++
        writeSignedInt24(legacyElapsed(clock, White).centis) ++
        writeSignedInt24(legacyElapsed(clock, Black).centis) ++
        clock.timer.fold(Array.empty[Byte])(writeTimer)
    }

    def read(ba: ByteArray, whiteBerserk: Boolean, blackBerserk: Boolean): Color => Clock =
      color => {
        val ia = ba.value map toInt

        // ba.size might be greater than 12 with 5 bytes timers
        // ba.size might be 8 if there was no timer.
        // #TODO remove 5 byte timer case! But fix the DB first!
        val timer = {
          if (ia.lengthIs == 12) readTimer(readInt(ia(8), ia(9), ia(10), ia(11)))
          else None
        }

        ia match {
          case Array(b1, b2, b3, b4, b5, b6, b7, b8, _*) =>
            val config      = Clock.Config(readClockLimit(b1), b2)
            val legacyWhite = Centis(readSignedInt24(b3, b4, b5))
            val legacyBlack = Centis(readSignedInt24(b6, b7, b8))
            Clock(
              config = config,
              color = color,
              players = Color.Map(
                ClockPlayer
                  .withConfig(config)
                  .copy(berserk = whiteBerserk)
                  .setRemaining(computeRemaining(config, legacyWhite)),
                ClockPlayer
                  .withConfig(config)
                  .copy(berserk = blackBerserk)
                  .setRemaining(computeRemaining(config, legacyBlack))
              ),
              timer = timer
            )
          case _ => sys error s"BinaryFormat.clock.read invalid bytes: ${ba.showBytes}"
        }
      }

    private def writeTimer(timer: Timestamp) = {
      val centis = (timer - start).centis
      /*
       * A zero timer is resolved by `readTimer` as the absence of a timer.
       * As a result, a clock that is started with a timer = 0
       * resolves as a clock that is not started.
       * This can happen when the clock was started at the same time as the game
       * For instance in simuls
       */
      val nonZero = centis atLeast 1
      writeInt(nonZero)
    }

    private def readTimer(l: Int) =
      if (l != 0) Some(start + Centis(l)) else None

    private def writeClockLimit(limit: Int): Byte = {
      // The database expects a byte for a limit, and this is limit / 60.
      // For 0.5+0, this does not give a round number, so there needs to be
      // an alternative way to describe 0.5.
      // The max limit where limit % 60 == 0, returns 180 for limit / 60
      // So, for the limits where limit % 30 == 0, we can use the space
      // from 181-255, where 181 represents 0.25 and 182 represents 0.50...
      (if (limit % 60 == 0) limit / 60 else limit / 15 + 180).toByte
    }

    private def readClockLimit(i: Int) = {
      if (i < 181) i * 60 else (i - 180) * 15
    }
  }

  object clock {
    def apply(start: DateTime) = new clock(Timestamp(start.getMillis))
  }

  object castleLastMove {

    def write(clmt: CastleLastMove): ByteArray = {
      def posInt(pos: Pos): Int = (pos.file.index << 3) + pos.rank.index
      val lastMoveInt = clmt.lastMove.map(_.origDest).fold(0) { case (o, d) =>
        (posInt(o) << 6) + chess.Direction.toInt(d)
      }
      Array((lastMoveInt >> 8) toByte, lastMoveInt.toByte)
    }

    def read(ba: ByteArray): CastleLastMove = {
      val ints = ba.value map toInt
      doRead(ints(0), ints(1))
    }

    private def doRead(b1: Int, b2: Int) =
      CastleLastMove(
        lastMove = for {
          orig <- Pos.at((b1 & 15) >> 1, ((b1 & 1) << 2) + (b2 >> 6))
          dir  = b2 match {
            case 0 => chess.Direction.Left
            case 1 => chess.Direction.Right
            case 2 => chess.Direction.Up
            case 3 => chess.Direction.Down
            case _ => chess.Direction.Up
          }
          if orig != Pos.A1
        } yield Uci.Move(orig, dir)
      )
  }

  object piece {

    private val positions: List[Pos] = Pos.all

    def write(pieces: PieceMap): ByteArray = {
      // If you use more than 32 piece at the same time it will overflow
      def stackToInt(stack: Stack[Piece]): Int =
        stack.zipWithIndex.foldLeft(0) { case (z: Int, (piece: Piece, index: Int)) =>
          piece.color match {
            case Color.White => (1 << index) + z
            case _ => z
          }
        }

      def posByteArray(stack: Stack[Piece]): Array[Byte] =
        if (stack isEmpty) Array(0.toByte)
        else {
          val n = stack.top.role match {
            case Capstone => ((stack.size << 1) + 1).toByte
            case _        => (stack.size << 1).toByte
          }
          val z =
            if (stack.top.role == Flatstone) 0
            else 1
          if (stack.size < 8) Array(n, ((z << 7) + stackToInt (stack take 7)).toByte)
          else Array(n, ((z << 7) + stackToInt (stack take 7)).toByte) ++ (1 to (stack.size/8 + 1)).map { i =>
                stackToInt(stack.slice(i*8, i*8 + 7)).toByte
              }
        }

      ByteArray((positions map { pos: Pos =>
        posByteArray(pieces getOrElse (pos, Stack[Piece]()))
      }).toArray.flatten)
    }

    // I'll leave the Variant param for future different sized boards
    def read(ba: ByteArray, variant: Variant): PieceMap = {
      def byteToStack(b: Byte, from: Int, limit: Int): Stack[Piece] = {
        val stack = Stack[Piece]()
        val start = 31 - from
        val end = start - limit
        stack.pushAll((end to start).map { i => if ((b << i) < 0) Piece(Color.White, Flatstone) else Piece(Color.Black, Flatstone) })
      }

      def correctStack(stack: Stack[Piece], header: Byte, firstByte: Byte): Stack[Piece] = {
        (firstByte, header) match {
          case (f, h) if f < 0 && h % 2 == 1 => stack.push(Piece(stack.pop().color, Capstone))
          case (f, h) if f < 0 && h % 2 == 0 => stack.push(Piece(stack.pop().color, Wallstone))
          case _ => stack
        }
      }

      // carefull the piece at the bottom is the reference of type
      def bytesToStack(a: Array[Byte]): Stack[Piece] = {
        val n = a(0) >>> 1
        if (n==0) Stack()
        else {
          val rest = n % 8
          val usefull = n / 8
          (a.drop(1).dropRight(1)).foldLeft(Stack[Piece]())( (z, b) => z ++ byteToStack(b, 0, 7)) ++ byteToStack(a.last, 0, rest - 1)
        }
      }

      def splitByPos(a: Array[Byte]): List[Array[Byte]]=
        a.size match {
          case 0 => List()
          case _ => {
            val n = a(0) >>> 1
            val (curr, next) = a splitAt (1 + (n.toFloat/8).ceil.toInt) // 1 for the header
            List(curr) ++ splitByPos(next)
          }
        }

      val stacksLists: List[Array[Byte]] = splitByPos(ba.value)


      positions.zip(stacksLists.map { bytes =>
        bytes.size match {
          case 0 => Stack[Piece]()
          case 1 => bytesToStack(bytes)
          case _ => correctStack(bytesToStack(bytes), bytes(0), bytes(1))
        }
      }).toMap
    }

    // cache standard start position
    val standard = write(Board.init(chess.variant.Standard).pieces)

    private def intToRole(int: Int, variant: Variant): Option[Role] =
      int match {
        case 1 => Some(Flatstone)
        case 2 => Some(Capstone)
        case 3 => Some(Wallstone)
        case _ => None
      }
    private def roleToInt(role: Role): Int =
      role match {
        case Flatstone => 1
        case Capstone => 2
        case Wallstone => 3
        case _ => 0
      }
  }

  @inline private def toInt(b: Byte): Int = b & 0xff

  def writeInt24(int: Int) = {
    val i = if (int < (1 << 24)) int else 0
    Array((i >>> 16).toByte, (i >>> 8).toByte, i.toByte)
  }

  private val int23Max = 1 << 23
  def writeSignedInt24(int: Int) = {
    val i = if (int < 0) int23Max - int else math.min(int, int23Max)
    writeInt24(i)
  }

  def readInt24(b1: Int, b2: Int, b3: Int) = (b1 << 16) | (b2 << 8) | b3

  def readSignedInt24(b1: Int, b2: Int, b3: Int) = {
    val i = readInt24(b1, b2, b3)
    if (i > int23Max) int23Max - i else i
  }

  def writeInt(i: Int) =
    Array(
      (i >>> 24).toByte,
      (i >>> 16).toByte,
      (i >>> 8).toByte,
      i.toByte
    )

  def readInt(b1: Int, b2: Int, b3: Int, b4: Int) = {
    (b1 << 24) | (b2 << 16) | (b3 << 8) | b4
  }
}

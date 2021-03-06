package lila.game

import chess._
import chess.format.Uci
import scala.collection.mutable.Stack
import lila.db.ByteArray

sealed trait PgnStorage

private object PgnStorage {

  case object OldBin extends PgnStorage {

    def encode(pgnMoves: PgnMoves) =
      ByteArray {
        monitor(_.game.pgn.encode("old")) {
          format.pgn.Binary.writeMoves(pgnMoves).get
        }
      }

    def decode(bytes: ByteArray, plies: Int): PgnMoves =
      monitor(_.game.pgn.decode("old")) {
        format.pgn.Binary.readMoves(bytes.value.toList, plies).get.toVector
      }
  }

  case object Huffman extends PgnStorage {

    import org.lichess.compression.game.{ Encoder, Piece => JavaPiece, Role => JavaRole }
    import scala.jdk.CollectionConverters._

    def encode(pgnMoves: PgnMoves) =
      ByteArray {
        monitor(_.game.pgn.encode("huffman")) {
          Encoder.encode(pgnMoves.toArray)
        }
      }
    def decode(bytes: ByteArray, plies: Int): Decoded =
      monitor(_.game.pgn.decode("huffman")) {
        val decoded      = Encoder.decode(bytes.value, plies)
        Decoded(
          pgnMoves = decoded.pgnMoves.toVector,
          pieces = decoded.pieces.asScala.view.flatMap { case (k, v) =>
            chessPos(k).map(_ -> Stack(chessPiece(v))) // temporary
          }.toMap,
          positionHashes = decoded.positionHashes,
          lastMove = Option(decoded.lastUci) flatMap Uci.apply,
          halfMoveClock = decoded.halfMoveClock
        )
      }

    private def chessPos(sq: Integer): Option[Pos] = Pos(sq)
    private def chessRole(role: JavaRole): Role =
      role match {
        case JavaRole.PAWN   => Flatstone //doing this assosiation to avoid messing with more libraries
        case JavaRole.KNIGHT => Wallstone
        case JavaRole.BISHOP => Capstone
        case JavaRole.ROOK   => Rook
        case JavaRole.QUEEN  => Queen
        case JavaRole.KING   => King
      }
    private def chessPiece(piece: JavaPiece): Piece =
      Piece(Color.fromWhite(piece.white), chessRole(piece.role))
  }

  case class Decoded(
      pgnMoves: PgnMoves,
      pieces: PieceMap,
      positionHashes: PositionHash, // irrelevant after game ends
      lastMove: Option[Uci],
      halfMoveClock: Int // irrelevant after game ends
  )

  private def monitor[A](mon: lila.mon.TimerPath)(f: => A): A =
    lila.common.Chronometer.syncMon(mon)(f)
}

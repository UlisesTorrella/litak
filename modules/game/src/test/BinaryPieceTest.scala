package lila.game

import chess._
import chess.Pos._
import chess.Piece._
import chess.Role._
import org.specs2.mutable._
import scala.collection.mutable.Stack
import chess.Color
import lila.game.BinaryFormat
import lila.db.ByteArray
import chess.variant.Standard

class BinaryPieceTest extends Specification {

  val noop = "00000000" // one byte
  def write(all: PieceMap): List[String] =
    (BinaryFormat.piece write all).showBytes.split(',').toList
  def read(bytes: List[String]): PieceMap =
    BinaryFormat.piece.read(ByteArray.parseBytes(bytes), Standard)

  val wf = Piece(White, Flatstone)
  val bf = Piece(Black, Flatstone)
  val ww = Piece(White, Wallstone)
  val bw = Piece(Black, Wallstone)
  val wc = Piece(White, Capstone)
  val bc = Piece(Black, Capstone)

  val map1 = Map( A1 -> Stack(wf))

  val first = BinaryFormat.piece.write(map1)
  val first_read = BinaryFormat.piece.read(first, Standard)

  val map2 = Map( A1 -> Stack(wf), F1 -> Stack(wc, wf, wf, bf))
  val sec = BinaryFormat.piece.write(map2)
  val sec_read = BinaryFormat.piece.read(sec, Standard)


  val map3 = Map( A1 -> Stack(wf), F1 -> Stack(wc, wf, wf, bf), C5 -> Stack(ww, bf,bf,bf,wf,wf,wf,wf,bf,bf,wf,wf,wf,wf))
  val third = BinaryFormat.piece.write(map3)
  val third_read = BinaryFormat.piece.read(third, Standard)

  "binary pieces" should {
    "write" should {
      "empty board" in {
        write(Map.empty) must_== List.fill(64*64)(noop)
      }
      "A1 white flatstone" in {
        write(Map(A1 -> Stack(Piece(Color.White, Flatstone)))) must_== {
          "00010000" :: List.fill(31)(noop)
        }
      }
      "A1 black knight" in {
        write(Map(A1 -> Black.knight)) must_== {
          "11000000" :: List.fill(31)(noop)
        }
      }
      "B1 black pawn" in {
        write(Map(B1 -> Black.pawn)) must_== {
          "00001110" :: List.fill(31)(noop)
        }
      }
      "A1 black knight, B1 white bishop" in {
        write(Map(A1 -> Black.knight, B1 -> White.bishop)) must_== {
          "11000101" :: List.fill(31)(noop)
        }
      }
      "A1 black knight, B1 white bishop, C1 white queen" in {
        write(Map(A1 -> Black.knight, B1 -> White.bishop, C1 -> White.queen)) must_== {
          "11000101" :: "00100000" :: List.fill(30)(noop)
        }
      }
      "H8 black knight" in {
        write(Map(H8 -> Black.knight)) must_== {
          List.fill(31)(noop) :+ "00001100"
        }
      }
      "G8 black knight, H8 white bishop" in {
        write(Map(G8 -> Black.knight, H8 -> White.bishop)) must_== {
          List.fill(31)(noop) :+ "11000101"
        }
      }
    }
    "read" should {
      "empty board" in {
        read(List.fill(32)(noop)) must_== Map.empty
        "A1 white king" in {
          read("00010000" :: List.fill(31)(noop)) must_== Map(A1 -> White.king)
        }
        "B1 black pawn" in {
          read("00001110" :: List.fill(31)(noop)) must_== Map(B1 -> Black.pawn)
        }
      }
    }
  }
}

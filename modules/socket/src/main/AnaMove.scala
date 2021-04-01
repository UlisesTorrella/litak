package lila.socket

import cats.data.Validated
import chess.format.{ FEN, Uci, UciCharPair }
import chess.variant.Variant
import play.api.libs.json._

import lila.tree.Branch
import chess.Direction.Direction

trait AnaAny {

  def branch: Validated[String, Branch]
  def chapterId: Option[String]
  def path: String
}

case class AnaMove(
    orig: chess.Pos,
    dir: Direction,
    variant: Variant,
    fen: FEN,
    path: String,
    chapterId: Option[String],
    index: Int,
    drops: List[Int]
) extends AnaAny {

  def branch: Validated[String, Branch] =
    chess.Game(variant.some, fen.some)(orig, dir, index, drops) flatMap { case (game, move) =>
      game.pgnMoves.lastOption toValid "Moved but no last move!" map { san =>
        val uci     = Uci(move)
        val movable = game.situation playable false
        val fen     = chess.format.Forsyth >> game
        Branch(
          id = UciCharPair(uci),
          ply = game.turns,
          move = Uci.WithSan(uci, san),
          fen = fen,
          check = game.situation.check,
          dests = Some(movable ?? game.situation.destinations),
          drops = if (movable) game.situation.drops else Some(Nil),
          crazyData = game.situation.board.crazyData
        )
      }
    }
}

object AnaMove {

  def parse(o: JsObject) =
    for {
      d    <- o obj "d"
      orig <- d str "orig" flatMap chess.Pos.fromKey
      dir  <- d str "dir"
      i    = d int "index" getOrElse 0
      drops<- d str "drops"
      fen  <- d str "fen" map FEN.apply
      path <- d str "path"
    } yield AnaMove(
      orig = orig,
      dir = chess.Direction(dir),
      variant = chess.variant.Variant orDefault ~d.str("variant"),
      fen = fen,
      path = path,
      chapterId = d str "ch",
      index = i,
      drops = drops.map(_.toInt - 48).toList
    )
}

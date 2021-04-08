package lila.app
package templating

import chess.{ Board, Color, Pos }
import lila.api.Context

import scala.collection.mutable.Stack
import lila.app.ui.ScalatagsTemplate._
import lila.game.Pov

trait ChessgroundHelper {

  private val cgWrap      = div(cls := "cg-wrap")
  private val cgHelper    = tag("cg-helper")
  private val cgContainer = tag("cg-container")
  private val cgBoard     = tag("cg-board")
  val cgWrapContent       = cgHelper(cgContainer(cgBoard))

  def chessground(board: Board, orient: Color, lastMove: List[Pos] = Nil)(implicit ctx: Context): Frag =
    wrap {
      cgBoard {
        raw {
          if (ctx.pref.is3d) ""
          else {
            def top(p: Pos, index: Int = 0)  = orient.fold(7 - p.rank.index, p.rank.index) * 12.5 - index * 5
            def left(p: Pos) = orient.fold(p.file.index, 7 - p.file.index) * 12.5
            val highlights = ctx.pref.highlight ?? lastMove.distinct.map { pos =>
              s"""<square class="last-move" style="top:${top(pos, 0)}%;left:${left(pos)}%"></square>"""
            } mkString ""
            // val pieces =
            //   if (ctx.pref.isBlindfold) ""
            //   else
            //     board.pieces collect {
            //       case (pos, stack) => { stack.zipWithIndex.foldLeft(""){ case (z, (piece, index)) =>
            //           z ++ s"""<piece class="${piece.color.name} ${piece.role.name}" style="top:${top(pos, index)}%;left:${left(pos)}%"></piece>"""
            //         }
            //       }
            //     } mkString ""
            s"$highlights"
          }
        }
      }
    }

  def chessground(pov: Pov)(implicit ctx: Context): Frag =
    chessground(
      board = pov.game.board,
      orient = pov.color,
      lastMove = Nil //pov.game.history.lastMove.map(_.origDest) ?? { case (orig, dest) =>
      //   List(orig, dir, i, drops)
      // }
    )

  private def wrap(content: Frag): Frag =
    cgWrap {
      cgHelper {
        cgContainer {
          content
        }
      }
    }

  lazy val chessgroundBoard = wrap(cgBoard)
}

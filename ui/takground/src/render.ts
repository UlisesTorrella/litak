import { State } from './state';
import { key2pos, createEl, moveTo } from './util';
import { whitePov } from './board';
import * as util from './util';
import { AnimCurrent, AnimVectors, AnimVector, AnimFadings } from './anim';
import { DragCurrent } from './drag';
import * as cg from './types';

type PieceName = string; // `$color $role`

type SquareClasses = Map<cg.Key, string>;

// ported from https://github.com/veloce/lichobile/blob/master/src/js/chessground/view.js
// in case of bugs, blame @veloce
export function render(s: State): void {
  console.log(s.index);

  const asWhite: boolean = whitePov(s),
    posToTranslate = s.dom.relative ? util.posToTranslateRel : util.posToTranslateAbs(s.dom.bounds()),
    translate = s.dom.relative ? util.translateRel : util.translateAbs,
    boardEl: HTMLElement = s.dom.elements.board,
    pieces: cg.Pieces = s.pieces,
    curAnim: AnimCurrent | undefined = s.animation.current,
    anims: AnimVectors = curAnim ? curAnim.plan.anims : new Map(),
    fadings: AnimFadings = curAnim ? curAnim.plan.fadings : new Map(),
    curDrag: DragCurrent | undefined = s.draggable.current,
    squares: SquareClasses = computeSquareClasses(s),
    samePieces: Set<cg.Key> = new Set(),
    sameSquares: Set<cg.Key> = new Set(),
    movedPieces: Map<PieceName, cg.PieceNode[]> = new Map(), // pieceName is not enough to identify
    movedSquares: Map<string, cg.SquareNode[]> = new Map(); // by class name
  let k: cg.Key,
    el: cg.PieceNode | cg.SquareNode | undefined,
    pieceAtKey: cg.Piece | undefined,
    elPieceName: PieceName,
    anim: AnimVector | undefined,
    fading: cg.Piece | undefined,
    // pMvdset: cg.PieceNode[] | undefined,
    // pMvd: cg.PieceNode | undefined,
    sMvdset: cg.SquareNode[] | undefined,
    sMvd: cg.SquareNode | undefined;

  // walk over all board dom elements, apply animations and flag moved pieces
  el = boardEl.firstChild as cg.PieceNode | cg.SquareNode | undefined;
  while (el) {
    k = el.cgKey;
    if (isPieceNode(el)) {
      const index = el.cgStackIndex;
      pieceAtKey = pieces.get(k);
      anim = anims.get(k);
      fading = fadings.get(k);
      elPieceName = el.cgPiece;
      // if piece not being dragged anymore, remove dragging style
      if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
        el.classList.remove('dragging');
        translate(el, posToTranslate(key2pos(k), asWhite));
        el.cgDragging = false;
      }
      // remove fading class if it still remains
      if (!fading && el.cgFading) {
        el.cgFading = false;
        el.classList.remove('fading');
      }
      // there is now a piece at this dom key
      if (pieceAtKey) {
        if (index && index! > 0 && pieceAtKey!.bellow && pieceAtKey.bellow!.length >= index) {
          pieceAtKey = pieceAtKey.bellow[index - 1];
          // continue animation if already animating and same piece
          // (otherwise it could animate a captured piece)
          if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
            const pos = key2pos(k);
            pos[0] += anim[2];
            pos[1] += anim[3];
            el.classList.add('anim');
            translate(el, posToTranslate(pos, asWhite));
          } else if (el.cgAnimating) {
            el.cgAnimating = false;
            el.classList.remove('anim');
            translate(el, posToTranslate(key2pos(k), asWhite));
            if (s.addPieceZIndex) el.style.zIndex = posZIndex(key2pos(k), asWhite);
          }
          // same piece: flag as same
          if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
            samePieces.add(k);
            appendValue(movedPieces, elPieceName, el); // Every piece goes here
          }
          // different piece: flag as moved unless it is a fading piece
          else {
            if (fading && elPieceName === pieceNameOf(fading)) {
              el.classList.add('fading');
              el.cgFading = true;
            } //else {
              appendValue(movedPieces, elPieceName, el);
            //}
          }
        }
        else {
          appendValue(movedPieces, elPieceName, el);
        }
      }
      // no piece: flag as moved
      else {
        appendValue(movedPieces, elPieceName, el);
      }
    } else if (isSquareNode(el)) {
      const cn = el.className;
      if (squares.get(k) === cn) sameSquares.add(k);
      else appendValue(movedSquares, cn, el);
    }
    el = el.nextSibling as cg.PieceNode | cg.SquareNode | undefined;
  }

  // walk over all squares in current set, apply dom changes to moved squares
  // or append new squares
  for (const [sk, className] of squares) {
    if (!sameSquares.has(sk)) {
      sMvdset = movedSquares.get(className);
      sMvd = sMvdset && sMvdset.pop();
      const translation = posToTranslate(key2pos(sk), asWhite);
      if (sMvd) {
        sMvd.cgKey = sk;
        translate(sMvd, translation);
      } else {
        const squareNode = createEl('square', className) as cg.SquareNode;
        squareNode.cgKey = sk;
        translate(squareNode, translation);
        boardEl.insertBefore(squareNode, boardEl.firstChild);
      }
    }
  }

  // walk over all pieces in current set, apply dom changes to moved pieces
  // or append new pieces
  for (const [k, p] of pieces) {
    anim = anims.get(k);
    //if (!samePieces.has(k)) { // now i update every time to show index
      if (p.bellow && p.bellow.length > 0){
        const bellowLength = p.bellow.length;
        const reversed = [...p.bellow].reverse();
        const pieces = reversed.map( (p, i) => {
          const pieceName = pieceNameOf(p),
            pieceNode = createEl('piece', pieceName) as cg.PieceNode;
          pieceNode.cgPiece = pieceName;
          pieceNode.cgKey = k;
          pieceNode.cgStackIndex = bellowLength - i;
          if (i == 0) {
            if(bellowLength - i + 1 <= s.index) {
              pieceNode.style.transform = `translate(0px,-10px)`;
            }
          }
          else {
            if(bellowLength - i + 1 == s.index) {
              pieceNode.style.transform = `translate(5px,-10px)`;
            }
            else {
              pieceNode.style.transform = `translate(5px,-5px)`;
            }
          }

          return pieceNode;
        })

        console.log(pieces);
        for (let i = 0; i < pieces.length-1; i++) {
          pieces[i+1].style.width = '100%';
          pieces[i+1].style.height = '100%';
          pieces[i].appendChild(pieces[i+1])
        }

        const topPieceName = pieceNameOf(p),
          topPieceNode = createEl('piece', topPieceName) as cg.PieceNode,
          pos = key2pos(k);
        topPieceNode.cgPiece = topPieceName;
        topPieceNode.cgKey = k;
        topPieceNode.cgStackIndex = 0;
        topPieceNode.style.width = '100%';
        topPieceNode.style.height = '100%';
        if (s.index === 1) {
          topPieceNode.style.transform = `translate(5px,-10px)`;
        }
        else {
          topPieceNode.style.transform = `translate(5px,-5px)`;
        }
        if (anim) {
          pieces[0].cgAnimating = true;
          pos[0] += anim[2];
          pos[1] += anim[3];
        }
        translate(pieces[0], posToTranslate(pos, asWhite));
        if (s.addPieceZIndex) {
          pieces[0].style.zIndex = posZIndex(pos, asWhite);
        }

        pieces[pieces.length-1].appendChild(topPieceNode);
        boardEl.appendChild(pieces[0]);
      }
      else {
        const pieceName = pieceNameOf(p),
          pieceNode = createEl('piece', pieceName) as cg.PieceNode,
          pos = key2pos(k);

        pieceNode.cgPiece = pieceName;
        pieceNode.cgKey = k;
        pieceNode.cgStackIndex = 0;
        if (anim) {
          pieceNode.cgAnimating = true;
          pos[0] += anim[2];
          pos[1] += anim[3];
        }
        translate(pieceNode, posToTranslate(pos, asWhite));
        if (s.addPieceZIndex) {
          pieceNode.style.zIndex = posZIndex(pos, asWhite);
        }
        boardEl.appendChild(pieceNode);
      }
//    }
  }

  // remove any element that remains in the moved sets
  for (const nodes of movedPieces.values()) removeNodes(s, nodes); /// TODO: remove all before rendering
  for (const nodes of movedSquares.values()) removeNodes(s, nodes);
}

export function updateBounds(s: State): void {
  if (s.dom.relative) return;
  const asWhite: boolean = whitePov(s),
    posToTranslate = util.posToTranslateAbs(s.dom.bounds());
  let el = s.dom.elements.board.firstChild as cg.PieceNode | cg.SquareNode | undefined;
  while (el) {
    if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
      util.translateAbs(el, posToTranslate(key2pos(el.cgKey), asWhite));
    }
    el = el.nextSibling as cg.PieceNode | cg.SquareNode | undefined;
  }
}

function isPieceNode(el: cg.PieceNode | cg.SquareNode): el is cg.PieceNode {
  return el.tagName === 'PIECE';
}
function isSquareNode(el: cg.PieceNode | cg.SquareNode): el is cg.SquareNode {
  return el.tagName === 'SQUARE';
}

function removeNodes(s: State, nodes: HTMLElement[]): void {
  for (const node of nodes) s.dom.elements.board.removeChild(node);
}

function posZIndex(pos: cg.Pos, asWhite: boolean): string {
  let z = 2 + pos[1] * 8 + (7 - pos[0]);
  if (asWhite) z = 67 - z;
  return z + ''; // from 100 up we have the top stones
}

function pieceNameOf(piece: cg.Piece): string {
  return `${piece.color} ${piece.role}`;
}

function computeSquareClasses(s: State): SquareClasses {
  const squares: SquareClasses = new Map();
  if (s.lastMove && s.highlight.lastMove)
    for (const k of s.lastMove) {
      addSquare(squares, k, 'last-move');
    }
  if (s.check && s.highlight.check) addSquare(squares, s.check, 'check');
  if (s.selected) {
    addSquare(squares, s.selected, 'selected');
    if (s.movable.showDests) {
      const dests = s.movable.dests?.get(s.selected);
      if (dests)
        for (const k of dests) {
          addSquare(squares, k, 'move-dest' + (s.pieces.has(k) ? ' oc' : ''));
        }
      const pDests = s.premovable.dests;
      if (pDests)
        for (const k of pDests) {
          addSquare(squares, k, 'premove-dest' + (s.pieces.has(k) ? ' oc' : ''));
        }
    }
  }
  if (s.premovable.current) {
    const premove = s.premovable.current;
    const drops = [...Array(premove.drops.length).keys()];;
    for (const n of drops) addSquare(squares, moveTo(premove.orig, premove.dir, n)!, 'current-premove');
  }
  else if (s.predroppable.current) addSquare(squares, s.predroppable.current.key, 'current-premove');

  const o = s.exploding;
  if (o) for (const k of o.keys) addSquare(squares, k, 'exploding' + o.stage);

  return squares;
}

function addSquare(squares: SquareClasses, key: cg.Key, klass: string): void {
  const classes = squares.get(key);
  if (classes) squares.set(key, `${classes} ${klass}`);
  else squares.set(key, klass);
}

function appendValue<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

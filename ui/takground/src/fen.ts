import { pos2key, invRanks } from './util';
import * as cg from './types';

export const initial: cg.FEN = '8/8/8/8/8/8/8/8';

const roles: { [letter: string]: cg.Role } = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
  f: 'flatstone',
  c: 'capstone',
  w: 'wallstone'
};

const letters = {
  pawn: 'p',
  rook: 'r',
  knight: 'n',
  bishop: 'b',
  queen: 'q',
  king: 'k',
  wallstone: 'w',
  capstone: 'c',
  flatstone: 'f'
};

export function read(fen: cg.FEN): cg.Pieces {
  if (fen === 'start') fen = initial;
  const pieces: cg.Pieces = new Map();
  let row = 7,
      col = 0;
  let stack: Array<cg.Piece> = [];
  for (const c of fen) {
    switch (c) {
      case ' ':
        return pieces;
      case '/':
        --row;
        if (row < 0) return pieces;
        col = 0;
        break;
      default:
        const nb = c.charCodeAt(0);
        if (nb == 40) {
          stack = [];
        }
        else if (nb == 41) {
          let piece = stack[0];
          piece.bellow = stack.splice(1);
          pieces.set(pos2key([col, row]), piece); // TODO: handle stacks
          ++col;
        }
        else if (nb < 57) col += nb - 48;
        else {
          const role = c.toLowerCase();
          stack.push({
            role: roles[role],
            color: c === role ? 'black' : 'white',
          });
        }
    }
  }
  return pieces;
}

export function write(pieces: cg.Pieces): cg.FEN {
  return invRanks
    .map(y =>
      cg.files
        .map(x => {
          const piece = pieces.get((x + y) as cg.Key);
          if (piece) {
            const letter = letters[piece.role];
            return piece.color === 'white' ? letter.toUpperCase() : letter;
          } else return '1';
        })
        .join('')
    )
    .join('/')
    .replace(/1{2,}/g, s => s.length.toString());
}

import * as cg from 'takground/types';
import { h } from 'snabbdom';
import { Hooks } from 'snabbdom/hooks';
import { opposite } from 'takground/util';
import { Redraw, EncodedDests, Dests, MaterialDiff, Step, CheckCount } from './interfaces';
import { VNodeData } from 'snabbdom/vnode';

const pieceScores = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
  capstone: 3,
  wallstone: 2,
  flatstone: 1
};

export const justIcon = (icon: string): VNodeData => ({
  attrs: { 'data-icon': icon },
});

export const uci2move = (uci: string): cg.Move | undefined => {
  if (!uci) return undefined;
  if (uci[1] === '@') return undefined; // Drops are not sopported here//[uci.slice(2, 4) as cg.Key];
  return {
    index: parseInt(uci[0]),
    orig: uci.slice(1, 3),
    dir: uci[3],
    drops: uci.slice(4).split("").map( i => parseInt(i))
  } as cg.Move;
};

export const onInsert = (f: (el: HTMLElement) => void): Hooks => ({
  insert(vnode) {
    f(vnode.elm as HTMLElement);
  },
});

export const bind = (eventName: string, f: (e: Event) => void, redraw?: Redraw, passive: boolean = true): Hooks =>
  onInsert(el => {
    el.addEventListener(
      eventName,
      e => {
        f(e);
        redraw && redraw();
      },
      { passive }
    );
  });

export function parsePossibleMoves(dests?: EncodedDests): Dests {
  const dec = new Map();
  if (!dests) return dec;
  if (typeof dests == 'string')
    for (const ds of dests.split(' ')) {
      dec.set(ds.slice(0, 2), ds.slice(2).match(/.{2}/g) as cg.Key[]);
    }
  else for (const k in dests) dec.set(k, dests[k].match(/.{2}/g) as cg.Key[]);
  return dec;
}

// {white: {pawn: 3 queen: 1}, black: {bishop: 2}}
export function getMaterialDiff(pieces: cg.Pieces): MaterialDiff {
  const diff: MaterialDiff = {
    white: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0, capstone: 0, flatstone: 0, wallstone: 0 },
    black: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0, capstone: 0, flatstone: 0, wallstone: 0 },
  };
  for (const p of pieces.values()) {
    const them = diff[opposite(p.color)];
    if (them[p.role] > 0) them[p.role]--;
    else diff[p.color][p.role]++;
  }
  return diff;
}

export function getScore(pieces: cg.Pieces): number {
  let score = 0;
  for (const p of pieces.values()) {
    score += pieceScores[p.role] * (p.color === 'white' ? 1 : -1);
  }
  return score;
}

export const noChecks: CheckCount = {
  white: 0,
  black: 0,
};

export function countChecks(steps: Step[], ply: Ply): CheckCount {
  const checks: CheckCount = { ...noChecks };
  for (let step of steps) {
    if (ply < step.ply) break;
    if (step.check) {
      if (step.ply % 2 === 1) checks.white++;
      else checks.black++;
    }
  }
  return checks;
}

export const spinner = () =>
  h(
    'div.spinner',
    {
      'aria-label': 'loading',
    },
    [
      h('svg', { attrs: { viewBox: '0 0 40 40' } }, [
        h('circle', {
          attrs: { cx: 20, cy: 20, r: 18, fill: 'none' },
        }),
      ]),
    ]
  );



export function moveTo(orig: cg.Key, dir: cg.Direction, n: number = 1): cg.Key | undefined {
  switch (dir) {
    case '+':
      let up = cg.ranks.findIndex( i => i==orig[1]) + n;
      if (up < cg.ranks.length) return `${orig[0]}${cg.ranks[up]}` as cg.Key;
      else return undefined;
    case '-':
      let down = cg.ranks.findIndex( i => i==orig[1]) - n;
      if (down >= 0) return `${orig[0]}${cg.ranks[down]}` as cg.Key;
      else return undefined;
    case '>':
      let right = cg.files.findIndex( i => i==orig[0]) + n;
      if (right < cg.files.length) return `${cg.files[right]}${orig[1]}` as cg.Key;
      else return undefined;
    case '<':
      let left = cg.files.findIndex( i => i==orig[0]) - n;
      if (left >= 0) return `${cg.files[left]}${orig[1]}` as cg.Key;
      else return undefined;
    default:
      return undefined;
  }
}

import * as cg from './types';

export const invRanks: readonly cg.Rank[] = [...cg.ranks].reverse();

export const allKeys: readonly cg.Key[] = Array.prototype.concat(...cg.files.map(c => cg.ranks.map(r => c + r)));

export const pos2key = (pos: cg.Pos): cg.Key => allKeys[8 * pos[0] + pos[1]];

export const key2pos = (k: cg.Key): cg.Pos => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];

export const allPos: readonly cg.Pos[] = allKeys.map(key2pos);

export function memo<A>(f: () => A): cg.Memo<A> {
  let v: A | undefined;
  const ret = (): A => {
    if (v === undefined) v = f();
    return v;
  };
  ret.clear = () => {
    v = undefined;
  };
  return ret;
}

export const timer = (): cg.Timer => {
  let startAt: number | undefined;
  return {
    start() {
      startAt = performance.now();
    },
    cancel() {
      startAt = undefined;
    },
    stop() {
      if (!startAt) return 0;
      const time = performance.now() - startAt;
      startAt = undefined;
      return time;
    },
  };
};

export const opposite = (c: cg.Color): cg.Color => (c === 'white' ? 'black' : 'white');

export const distanceSq = (pos1: cg.Pos, pos2: cg.Pos): number => {
  const dx = pos1[0] - pos2[0],
    dy = pos1[1] - pos2[1];
  return dx * dx + dy * dy;
};

export const samePiece = (p1: cg.Piece, p2: cg.Piece): boolean => p1.role === p2.role && p1.color === p2.color;

const posToTranslateBase = (pos: cg.Pos, asWhite: boolean, xFactor: number, yFactor: number, index?: number): cg.NumberPair => [
  (asWhite ? pos[0] : 7 - pos[0]) * xFactor,
  (asWhite ? 7 - pos[1] : pos[1]) * yFactor + (index ? index + 1 : 0) * 5,
];

export const posToTranslateAbs = (bounds: ClientRect): ((pos: cg.Pos, asWhite: boolean, index?: number) => cg.NumberPair) => {
  const xFactor = bounds.width / 8,
    yFactor = bounds.height / 8;
  return (pos, asWhite, index) => posToTranslateBase(pos, asWhite, xFactor, yFactor, index);
};

export const posToTranslateRel = (pos: cg.Pos, asWhite: boolean, index?: number): cg.NumberPair =>
  posToTranslateBase(pos, asWhite, 100, 100, index);

export const translateAbs = (el: HTMLElement, pos: cg.NumberPair, lifted: boolean = false): void => {
  if (lifted) el.style.transform = `translate(${pos[0]}px,${pos[1] - 5}px)`;
  else el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
};

export const translateRel = (el: HTMLElement, percents: cg.NumberPair, lifted: boolean = false): void => {
  if (lifted) el.style.transform = `translate(${percents[0]}%,${percents[1] - 0.2}%)`;
  else el.style.transform = `translate(${percents[0]}%,${percents[1]}%)`;
};

export const setVisible = (el: HTMLElement, v: boolean): void => {
  el.style.visibility = v ? 'visible' : 'hidden';
};

export const eventPosition = (e: cg.MouchEvent): cg.NumberPair | undefined => {
  if (e.clientX || e.clientX === 0) return [e.clientX, e.clientY!];
  if (e.targetTouches?.[0]) return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
  return; // touchend has no position!
};

export const isRightButton = (e: cg.MouchEvent): boolean => e.buttons === 2 || e.button === 2;

export const createEl = (tagName: string, className?: string): HTMLElement => {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  return el;
};

export function computeSquareCenter(key: cg.Key, asWhite: boolean, bounds: ClientRect): cg.NumberPair {
  const pos = key2pos(key);
  if (!asWhite) {
    pos[0] = 7 - pos[0];
    pos[1] = 7 - pos[1];
  }
  return [
    bounds.left + (bounds.width * pos[0]) / 8 + bounds.width / 16,
    bounds.top + (bounds.height * (7 - pos[1])) / 8 + bounds.height / 16,
  ];
}

export function keysToDir(orig: cg.Key, dest: cg.Key) {
  const fdiff = orig.charCodeAt(0) - dest.charCodeAt(0);
  const rdiff = orig.charCodeAt(1) - dest.charCodeAt(1);
  if (fdiff===0) return (rdiff>0) ? '-' as cg.Direction : '+' as cg.Direction;
  else return (fdiff>0) ? '<' as cg.Direction : '>' as cg.Direction;
}



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

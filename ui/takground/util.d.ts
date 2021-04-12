/// <reference types="lichess" />
import * as cg from './types';
export declare const invRanks: readonly cg.Rank[];
export declare const allKeys: readonly cg.Key[];
export declare const pos2key: (pos: cg.Pos) => cg.Key;
export declare const key2pos: (k: cg.Key) => cg.Pos;
export declare const allPos: readonly cg.Pos[];
export declare function memo<A>(f: () => A): cg.Memo<A>;
export declare const timer: () => cg.Timer;
export declare const opposite: (c: cg.Color) => cg.Color;
export declare const distanceSq: (pos1: cg.Pos, pos2: cg.Pos) => number;
export declare const samePiece: (p1: cg.Piece, p2: cg.Piece) => boolean;
export declare const posToTranslateAbs: (bounds: ClientRect) => (pos: cg.Pos, asWhite: boolean, index?: number | undefined) => cg.NumberPair;
export declare const posToTranslateRel: (pos: cg.Pos, asWhite: boolean, index?: number | undefined) => cg.NumberPair;
export declare const translateAbs: (el: HTMLElement, pos: cg.NumberPair, lifted?: boolean) => void;
export declare const translateRel: (el: HTMLElement, percents: cg.NumberPair, lifted?: boolean) => void;
export declare const setVisible: (el: HTMLElement, v: boolean) => void;
export declare const eventPosition: (e: cg.MouchEvent) => cg.NumberPair | undefined;
export declare const isRightButton: (e: cg.MouchEvent) => boolean;
export declare const createEl: (tagName: string, className?: string | undefined) => HTMLElement;
export declare function computeSquareCenter(key: cg.Key, asWhite: boolean, bounds: ClientRect): cg.NumberPair;
export declare function keysToDir(orig: cg.Key, dest: cg.Key): cg.Direction;
export declare function moveTo(orig: cg.Key, dir: cg.Direction, n?: number): cg.Key | undefined;

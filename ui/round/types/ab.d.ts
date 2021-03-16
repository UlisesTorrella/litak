declare module 'ab' {
  import { MoveMetadata } from 'takground/types';
  function init(round: unknown): void;
  function move(round: unknown, meta: MoveMetadata): void;
}

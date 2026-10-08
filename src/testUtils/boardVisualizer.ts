import { Square } from 'chess.js';

import { DomainPiece } from '../domain/types';
import { UseChessGameResult } from '../hooks/useChessGame';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

function symbolFor(piece: DomainPiece): string {
  return piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
}

// The `result` ref renderHook() returns - `const { result } = await
// renderHook(...)` - a plain { current } box around the live hook value,
// refreshed after every act(). Typed structurally rather than importing
// RNTL's own RefObject, since that type isn't part of the library's public
// exports (it's internal to render-hook.d.ts).
type ChessGameResultRef = { current: Pick<UseChessGameResult, 'pieces'> };

// Renders the `pieces` from a useChessGame renderHook() result as an 8x8
// text grid - uppercase letters for white, lowercase for black, "." for an
// empty square - oriented exactly like the on-screen board (rank 8 at the
// top). Not wired up anywhere yet; just a quick way to eyeball board state
// (e.g. console.log(renderBoardAsText(result))) from a test or debugger
// without reaching for the simulator.
export function renderBoardAsText(resultRef: ChessGameResultRef): string {
  const { pieces } = resultRef.current;
  const bySquare = new Map(pieces.map((piece) => [piece.square, piece]));

  const rows = RANKS.map((rank) => {
    const squares = FILES.map((file) => {
      const piece = bySquare.get(`${file}${rank}` as Square);
      return piece ? symbolFor(piece) : '.';
    });
    return `${rank} ${squares.join(' ')} ${rank}`;
  });

  const fileLabels = `  ${FILES.join(' ')}`;
  return [fileLabels, ...rows, fileLabels].join('\n');
}

// Thin convenience wrapper for the common case of just wanting it on
// stdout immediately, without a separate console.log call at the call site.
export function printBoard(
  resultRef: ChessGameResultRef,
  message?: string,
): void {
  console.log(renderBoardAsText(resultRef), message || '');
}

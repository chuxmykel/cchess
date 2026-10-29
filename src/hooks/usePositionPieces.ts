import { useLayoutEffect, useRef } from 'react';
import { makeMutable, SharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Color, PieceSymbol } from 'chess.js';

import { MOVE_TIMING } from '../constants/animations';
import { getXYFromSquare } from '../domain/boardCoordinates';
import { piecesFromFen } from '../domain/fen';
import { IdentifiedPiece, matchPieces } from '../domain/matchPieces';

export type PositionPieceView = IdentifiedPiece & {
  spriteId: `${Color}${PieceSymbol}`;
  // Where it's drawn, from white's side (see Chessboard).
  x: SharedValue<number>;
  y: SharedValue<number>;
};

type Cached = { fen: string; pieceWidth: number; views: PositionPieceView[] };

// The pieces of a position drawn straight from a FEN - a game looked back
// on - kept the same pieces from one position to the next (see
// matchPieces), so stepping through a game moves them rather than drawing
// new ones in their place, which flickers as the new images load. A piece
// that moved slides to its square when `animate` is set, or is there at
// once; `onSettled` runs once they're all there.
export function usePositionPieces(
  fen: string,
  pieceWidth: number,
  animate: boolean,
  onSettled?: () => void,
): PositionPieceView[] {
  // Diffed against the last position during render, as usePieceAnimations
  // does, so a new position draws its pieces in their old places first -
  // then they move. react-hooks/refs warns of reading refs during render;
  // that's a React-Compiler-readiness rule and no compiler runs here.
  /* eslint-disable react-hooks/refs */
  const cached = useRef<Cached | null>(null);
  const nextId = useRef(0);
  const latestOnSettled = useRef(onSettled);
  useLayoutEffect(() => {
    latestOnSettled.current = onSettled;
  });

  const previous = cached.current;
  if (!previous || previous.fen !== fen || previous.pieceWidth !== pieceWidth) {
    const matched = matchPieces(
      previous?.views ?? [],
      piecesFromFen(fen),
      () => `piece-${nextId.current++}`,
    );
    const kept = new Map(previous?.views.map((view) => [view.id, view]));
    const views = matched.map((piece): PositionPieceView => {
      const spriteId = `${piece.color}${piece.type}` as const;
      const was = kept.get(piece.id);
      if (was) return { ...piece, spriteId, x: was.x, y: was.y };
      const at = getXYFromSquare(piece.square, pieceWidth);
      return {
        ...piece,
        spriteId,
        x: makeMutable(at.x),
        y: makeMutable(at.y),
      };
    });
    cached.current = { fen, pieceWidth, views };
  }
  const { views } = cached.current;

  // A layout effect, so the pieces are already moving in the first frame
  // that shows the new position.
  useLayoutEffect(() => {
    let moving = 0;
    const settle = () => {
      moving -= 1;
      if (moving === 0) latestOnSettled.current?.();
    };
    const moveAxis = (axis: SharedValue<number>, target: number) => {
      if (!animate || axis.get() === target) {
        axis.set(target);
        return;
      }
      moving += 1;
      axis.set(
        withTiming(target, MOVE_TIMING, () => {
          'worklet';
          scheduleOnRN(settle);
        }),
      );
    };
    views.forEach((view) => {
      const to = getXYFromSquare(view.square, pieceWidth);
      moveAxis(view.x, to.x);
      moveAxis(view.y, to.y);
    });
    if (moving === 0) latestOnSettled.current?.();
  }, [views, pieceWidth, animate]);

  return views;
  /* eslint-enable react-hooks/refs */
}

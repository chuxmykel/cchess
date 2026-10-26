import { useState } from 'react';
import { DEFAULT_POSITION } from 'chess.js';

import { GameMoveSummary } from '../network/socketEvents';

export type MoveNavigation = {
  viewedFen: string | null;
  currentPly: number;
  isLive: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  back: () => void;
  forward: () => void;
  toLive: () => void;
  goTo: (ply: number) => void;
};

type BrowsedPosition = {
  ply: number;
  moveCountWhenBrowsed: number;
};

function fenAfterPly(moves: GameMoveSummary[], ply: number): string {
  return ply === 0 ? DEFAULT_POSITION : moves[ply - 1].fenAfter;
}

export function useMoveNavigation(moves: GameMoveSummary[]): MoveNavigation {
  const [browsedPosition, setBrowsedPosition] =
    useState<BrowsedPosition | null>(null);
  const moveCount = moves.length;
  const browsedPly =
    browsedPosition?.moveCountWhenBrowsed === moveCount
      ? browsedPosition.ply
      : null;
  const currentPly = browsedPly ?? moveCount;

  function goTo(ply: number) {
    const clampedPly = Math.max(0, Math.min(ply, moveCount));
    setBrowsedPosition(
      clampedPly === moveCount
        ? null
        : { ply: clampedPly, moveCountWhenBrowsed: moveCount },
    );
  }

  return {
    viewedFen: browsedPly === null ? null : fenAfterPly(moves, browsedPly),
    currentPly,
    isLive: browsedPly === null,
    canGoBack: currentPly > 0,
    canGoForward: browsedPly !== null,
    back: () => goTo(currentPly - 1),
    forward: () => goTo(currentPly + 1),
    toLive: () => goTo(moveCount),
    goTo,
  };
}

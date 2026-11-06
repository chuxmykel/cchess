import { useState } from 'react';
import { Color } from 'chess.js';

import {
  GameMoveSummary,
  GameSnapshot,
  GameUserSummary,
} from '../network/socketEvents';

/** A daily game as its screen has it now, moves coming in and all. */
export type DailyGamePosition = {
  white: GameUserSummary;
  black: GameUserSummary;
  myColor: Color;
  fen: string;
  moves: GameMoveSummary[];
  status: GameSnapshot['status'];
};

export type DailyGamePositions = {
  get: (gameId: string) => DailyGamePosition | null;
  set: (gameId: string, position: DailyGamePosition) => void;
  remove: (gameId: string) => void;
  subscribe: (listener: () => void) => () => void;
};

function createDailyGamePositions(): DailyGamePositions {
  const positions = new Map<string, DailyGamePosition>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    get: (gameId) => positions.get(gameId) ?? null,
    set: (gameId, position) => {
      positions.set(gameId, position);
      notify();
    },
    remove: (gameId) => {
      if (positions.delete(gameId)) notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// The daily games open on screen, each kept as it stands by its game screen
// - for the analysis board opened over it, which starts from the game's
// position without fetching it, and goes back to it on Reset.
export function useDailyGamePositions(): DailyGamePositions {
  const [positions] = useState(createDailyGamePositions);
  return positions;
}

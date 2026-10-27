import { useCallback, useState } from 'react';

import { DEFAULT_RATING_RANGE, Seek } from '../constants/seek';
import { TimeControl } from '../constants/timeControls';

export type GameSession =
  | { phase: 'seeking'; seek: Seek }
  | { phase: 'playing'; gameId: string; seek?: Seek };

export type GameSessionStart = { seek: Seek } | { gameId: string };

export type UseGameSessionResult = {
  session: GameSession;
  startGame: (gameId: string) => void;
  seekNewOpponent: (timeControl: TimeControl) => void;
};

const DEFAULT_SEEK_OPTIONS = { rated: true, ratingRange: DEFAULT_RATING_RANGE };

export function useGameSession(start: GameSessionStart): UseGameSessionResult {
  const [session, setSession] = useState<GameSession>(() =>
    'gameId' in start
      ? { phase: 'playing', gameId: start.gameId }
      : { phase: 'seeking', seek: start.seek },
  );

  const startGame = useCallback((gameId: string) => {
    setSession((previous) => ({
      phase: 'playing',
      gameId,
      seek: previous.seek,
    }));
  }, []);

  const seekNewOpponent = useCallback((timeControl: TimeControl) => {
    setSession((previous) => ({
      phase: 'seeking',
      seek: { ...(previous.seek ?? DEFAULT_SEEK_OPTIONS), timeControl },
    }));
  }, []);

  return { session, startGame, seekNewOpponent };
}

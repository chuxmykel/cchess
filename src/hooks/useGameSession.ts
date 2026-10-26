import { useCallback, useState } from 'react';

import { TimeControl } from '../constants/timeControls';

export type GameSession =
  | { phase: 'seeking'; timeControl: TimeControl }
  | { phase: 'playing'; gameId: string; timeControl?: TimeControl };

export type GameSessionStart =
  { timeControl: TimeControl } | { gameId: string };

export type UseGameSessionResult = {
  session: GameSession;
  startGame: (gameId: string) => void;
  seekNewOpponent: (timeControl: TimeControl) => void;
};

export function useGameSession(start: GameSessionStart): UseGameSessionResult {
  const [session, setSession] = useState<GameSession>(() =>
    'gameId' in start
      ? { phase: 'playing', gameId: start.gameId }
      : { phase: 'seeking', timeControl: start.timeControl },
  );

  const startGame = useCallback((gameId: string) => {
    setSession((previous) => ({
      phase: 'playing',
      gameId,
      timeControl: previous.timeControl,
    }));
  }, []);

  const seekNewOpponent = useCallback((timeControl: TimeControl) => {
    setSession({ phase: 'seeking', timeControl });
  }, []);

  return { session, startGame, seekNewOpponent };
}

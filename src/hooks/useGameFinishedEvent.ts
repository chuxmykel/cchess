import { useEffect, useRef } from 'react';
import { Color } from 'chess.js';

import { analytics } from '../analytics/analytics';

export type FinishedGame = {
  isGameOver: boolean;
  gameStatus: string;
  gameType: string;
  rated: boolean;
  myColor: Color;
  result: 'white' | 'black' | 'draw' | null;
  resultReason: string | null;
};

/** Reports a game the player sees finish - once, as it ends, never one
 * already over when it opened. */
export function useGameFinishedEvent(game: FinishedGame): void {
  const wasActive = useRef(!game.isGameOver);
  const { isGameOver } = game;
  const latest = useRef(game);
  // eslint-disable-next-line react-hooks/refs -- always-latest ref, read in the effect below
  latest.current = game;

  useEffect(() => {
    if (!isGameOver) {
      wasActive.current = true;
      return;
    }
    if (!wasActive.current) return;
    wasActive.current = false;
    const { gameStatus, gameType, rated, myColor, result, resultReason } =
      latest.current;
    const mine = myColor === 'w' ? 'white' : 'black';
    analytics.capture('game_finished', {
      gameType,
      rated,
      status: gameStatus,
      result:
        result === null
          ? null
          : result === 'draw'
            ? 'draw'
            : result === mine
              ? 'win'
              : 'loss',
      reason: resultReason,
    });
  }, [isGameOver]);
}

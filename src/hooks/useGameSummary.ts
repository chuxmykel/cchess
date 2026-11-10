import { useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getGame } from '../network/restClient';
import { GameSnapshot } from '../network/socketEvents';

// Each game asked for once - a conversation can share the same game more
// than once, and each card drawing it shouldn't fetch it again.
const cache = new Map<string, Promise<GameSnapshot>>();

/** Forgets every game fetched - for tests. */
export function clearGameSummaryCache(): void {
  cache.clear();
}

/**
 * A game shared in a message, as a card draws it: its players, result and
 * position, as they were when first asked for - null while it comes,
 * 'error' if it can't.
 */
export function useGameSummary(gameId: string): GameSnapshot | null | 'error' {
  const { authorized } = useAuthSession();
  const [game, setGame] = useState<GameSnapshot | null | 'error'>(null);

  useEffect(() => {
    let isCurrent = true;
    let request = cache.get(gameId);
    if (!request) {
      request = authorized((token) => getGame(gameId, token));
      cache.set(gameId, request);
      // A failure is tried again by the next card to ask.
      request.catch(() => cache.delete(gameId));
    }
    request
      .then((snapshot) => {
        if (isCurrent) setGame(snapshot);
      })
      .catch(() => {
        if (isCurrent) setGame('error');
      });
    return () => {
      isCurrent = false;
    };
  }, [authorized, gameId]);

  return game;
}

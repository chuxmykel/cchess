import { useCallback } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { createDailySeek, NewDailySeek } from '../network/restClient';

/** Where a daily seek went: a game started with a seek already waiting,
 * or left waiting for one. */
export type DailySeekOutcome =
  { status: 'matched'; gameId: string } | { status: 'queued' };

/**
 * Seeks a daily game - posted, and left: matched at once with a seek
 * waiting that agrees with it, or waiting for one, however long, the game
 * then arriving as game:created (see useDailyGames). Rejects with the
 * server's message.
 */
export function useSeekDailyGame(): (
  seek: NewDailySeek,
) => Promise<DailySeekOutcome> {
  const { authorized } = useAuthSession();
  return useCallback(
    async (seek) => {
      const result = await authorized((token) => createDailySeek(seek, token));
      return result.status === 'matched'
        ? { status: 'matched', gameId: result.game.id }
        : { status: 'queued' };
    },
    [authorized],
  );
}

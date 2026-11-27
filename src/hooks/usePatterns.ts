import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  type DigestedGame,
  type Patterns,
  patternsOf,
} from '../domain/review/patterns';
import { getPatterns, RatingPeriod } from '../network/restClient';

export type PatternsState =
  | { status: 'loading' }
  | { status: 'error' }
  // Null with no reviewed games in the period.
  | { status: 'ready'; patterns: Patterns | null; period: RatingPeriod };

// Your patterns over a period, from your reviewed games' digests
// (`GET /users/:username/patterns`) - the server sends them to you alone.
export function usePatterns(
  username: string,
  period: RatingPeriod,
): { state: PatternsState; reload: () => Promise<void> } {
  const { authorized } = useAuthSession();
  const [loaded, setLoaded] = useState<{
    key: string;
    games: DigestedGame[] | null;
  } | null>(null);
  const key = `${username}:${period}`;

  const reload = useCallback(
    () =>
      authorized((token) => getPatterns(username, period, token))
        .then(({ games }) => setLoaded({ key, games }))
        .catch(() => setLoaded({ key, games: null })),
    [authorized, username, period, key],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  let state: PatternsState;
  if (!loaded || loaded.key !== key) state = { status: 'loading' };
  else if (!loaded.games) state = { status: 'error' };
  else
    state = {
      status: 'ready',
      patterns: loaded.games.length > 0 ? patternsOf(loaded.games) : null,
      period,
    };
  return { state, reload };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { GameType } from '../domain/types';
import {
  getRatingStats,
  RatingPeriod,
  RatingStats,
} from '../network/restClient';

export type RatingStatsState =
  | { status: 'loading' }
  | { status: 'error' }
  /** isUpdating while another period's stats are on their way; didFail
   * when they couldn't be loaded, leaving the last ones shown. */
  | {
      status: 'ready';
      stats: RatingStats;
      isUpdating: boolean;
      didFail: boolean;
    };

// A player's rating history and results in one category over a period,
// keeping the last ones shown while a newly chosen category or period loads.
export function useRatingStats(
  username: string,
  category: GameType,
  period: RatingPeriod,
): { state: RatingStatsState; reload: () => void } {
  const { authorized } = useAuthSession();
  const [stats, setStats] = useState<RatingStats | null>(null);
  // Which category and period last failed to load, as `category:period`.
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    authorized((token) => getRatingStats(username, category, period, token))
      .then((loaded) => {
        if (requestId === latestRequest.current) {
          setStats(loaded);
          setFailedKey(null);
        }
      })
      .catch(() => {
        if (requestId === latestRequest.current) {
          setFailedKey(`${category}:${period}`);
        }
      });
  }, [authorized, username, category, period]);

  useEffect(() => {
    reload();
  }, [reload]);

  let state: RatingStatsState;
  if (stats) {
    const isCurrent =
      stats.period === period && stats.rating.category === category;
    const didFail = failedKey === `${category}:${period}`;
    const isUpdating = !isCurrent && !didFail;
    state = { status: 'ready', stats, isUpdating, didFail };
  } else {
    state = {
      status: failedKey === `${category}:${period}` ? 'error' : 'loading',
    };
  }
  return { state, reload };
}

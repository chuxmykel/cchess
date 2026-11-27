import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  getPuzzleStats,
  PuzzleStats,
  RatingPeriod,
} from '../network/restClient';

export type PuzzleStatsState =
  | { status: 'loading' }
  | { status: 'error' }
  /** isUpdating while another period's stats are on their way; didFail
   * when they couldn't be loaded, leaving the last ones shown. */
  | {
      status: 'ready';
      stats: PuzzleStats;
      isUpdating: boolean;
      didFail: boolean;
    };

// A player's puzzle rating history and tries over a period, keeping the
// last ones shown while a newly chosen period loads (as useRatingStats).
export function usePuzzleStats(
  username: string,
  period: RatingPeriod,
): { state: PuzzleStatsState; reload: () => Promise<void> } {
  const { authorized } = useAuthSession();
  const [stats, setStats] = useState<PuzzleStats | null>(null);
  // The period that last failed to load.
  const [failedPeriod, setFailedPeriod] = useState<RatingPeriod | null>(null);
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    return authorized((token) => getPuzzleStats(username, period, token))
      .then((loaded) => {
        if (requestId === latestRequest.current) {
          setStats(loaded);
          setFailedPeriod(null);
        }
      })
      .catch(() => {
        if (requestId === latestRequest.current) setFailedPeriod(period);
      });
  }, [authorized, username, period]);

  useEffect(() => {
    reload();
  }, [reload]);

  let state: PuzzleStatsState;
  if (stats) {
    const didFail = failedPeriod === period;
    const isUpdating = stats.period !== period && !didFail;
    state = { status: 'ready', stats, isUpdating, didFail };
  } else {
    state = { status: failedPeriod === period ? 'error' : 'loading' };
  }
  return { state, reload };
}

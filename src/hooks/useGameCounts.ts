import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  GameCount,
  getMyGameCounts,
  getUserGameCounts,
} from '../network/restClient';

/**
 * A player's finished games counted by result and type - yours, or the
 * named player's - for a history's filters to total; null until loaded,
 * and kept as it was when a reload fails.
 */
export function useGameCounts(username?: string): {
  counts: GameCount[] | null;
  reload: () => Promise<void>;
} {
  const { authorized } = useAuthSession();
  const [counts, setCounts] = useState<GameCount[] | null>(null);
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    return authorized((token) =>
      username ? getUserGameCounts(username, token) : getMyGameCounts(token),
    )
      .then((loaded) => {
        if (requestId === latestRequest.current) setCounts(loaded);
      })
      .catch(() => {});
  }, [authorized, username]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { counts, reload };
}

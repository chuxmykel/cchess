import { useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { ExplorerPosition, getExplorer } from '../network/restClient';

export type OpeningExplorerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; position: ExplorerPosition }
  | { status: 'error' };

type Fetched = { fen: string; result: ExplorerPosition | null };

/**
 * The opening explorer's view of a position - the moves played from it in
 * games finished here - fetched while `enabled` (its sheet open), once a
 * position: each one asked for is kept, so stepping back and forth through
 * a line asks the server nothing more.
 */
export function useOpeningExplorer(
  fen: string,
  enabled: boolean,
): OpeningExplorerState {
  const { authorized } = useAuthSession();
  const [cache, setCache] = useState<Map<string, Fetched>>(() => new Map());
  const cached = cache.get(fen);

  useEffect(() => {
    if (!enabled || cached) return;
    let current = true;
    authorized((token) => getExplorer(fen, token))
      .then((position) => ({ fen, result: position }))
      .catch(() => ({ fen, result: null }))
      .then((fetched) => {
        if (!current) return;
        setCache((previous) => new Map(previous).set(fen, fetched));
      });
    return () => {
      current = false;
    };
  }, [authorized, fen, enabled, cached]);

  if (!enabled) return { status: 'idle' };
  if (!cached) return { status: 'loading' };
  return cached.result
    ? { status: 'ready', position: cached.result }
    : { status: 'error' };
}

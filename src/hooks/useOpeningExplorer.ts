import { useEffect, useState } from 'react';

import { EXPLORER_FETCH_DELAY_MS } from '../constants/explorer';
import { useAuthSession } from '../context/AuthSessionContext';
import {
  ExplorerPosition,
  ExplorerQuery,
  getExplorer,
} from '../network/restClient';

export type OpeningExplorerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; position: ExplorerPosition }
  | { status: 'error' };

/**
 * The opening explorer's view of a position - the moves played from it in
 * the database `query` names - or nothing while `query` is null. A position
 * is asked about once it's been shown 300ms, so stepping quickly through a
 * line asks only where it stops; each answer is kept, so stepping back and
 * forth asks nothing more. A failure isn't kept: coming back asks again.
 * `query` is compared by value, so it needn't be memoised.
 */
export function useOpeningExplorer(
  fen: string,
  query: ExplorerQuery | null,
): OpeningExplorerState {
  const { authorized } = useAuthSession();
  const [cache, setCache] = useState<Map<string, ExplorerPosition>>(
    () => new Map(),
  );
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const queryKey = query ? JSON.stringify(query) : null;
  const key = queryKey ? `${queryKey}|${fen}` : null;
  const cached = key ? cache.get(key) : undefined;

  useEffect(() => {
    if (!key || !queryKey || cached) return;
    let current = true;
    const timer = setTimeout(() => {
      authorized((token) => getExplorer(fen, token, JSON.parse(queryKey)))
        .then((position) => {
          if (current)
            setCache((previous) => new Map(previous).set(key, position));
        })
        .catch(() => {
          if (current) setFailedKey(key);
        });
    }, EXPLORER_FETCH_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [authorized, fen, key, queryKey, cached]);

  if (!key) return { status: 'idle' };
  if (cached) return { status: 'ready', position: cached };
  return failedKey === key ? { status: 'error' } : { status: 'loading' };
}

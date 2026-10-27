import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { GameSummary, GamesPage } from '../network/restClient';

export type FetchGamesPage = (
  page: GamesPage,
  accessToken: string,
) => Promise<GameSummary[]>;

export type PagedGames = {
  games: GameSummary[];
  status: 'loading' | 'ready' | 'error';
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
};

// A player's finished games, newest first, a page at a time.
export function usePagedGames(
  fetchPage: FetchGamesPage,
  pageSize: number,
): PagedGames {
  const { authorized } = useAuthSession();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [status, setStatus] = useState<PagedGames['status']>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(
    (before?: string) => {
      latestRequest.current += 1;
      const requestId = latestRequest.current;
      authorized((token) => fetchPage({ limit: pageSize, before }, token))
        .then((page) => {
          if (requestId !== latestRequest.current) return;
          const finished = page.filter((game) => game.status !== 'active');
          setGames((previous) =>
            before ? [...previous, ...finished] : finished,
          );
          setHasMore(page.length === pageSize);
          setStatus('ready');
        })
        .catch(() => {
          if (requestId !== latestRequest.current) return;
          if (!before) setStatus('error');
        })
        .finally(() => {
          if (requestId === latestRequest.current) setIsLoadingMore(false);
        });
    },
    [authorized, fetchPage, pageSize],
  );

  useEffect(() => {
    load();
  }, [load]);

  const oldest = games.at(-1)?.createdAt;
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && oldest) {
      setIsLoadingMore(true);
      load(oldest);
    }
  }, [hasMore, isLoadingMore, oldest, load]);

  const reload = useCallback(() => load(), [load]);

  return { games, status, hasMore, isLoadingMore, loadMore, reload };
}

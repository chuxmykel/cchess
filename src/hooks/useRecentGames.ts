import { useCallback, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { GameSummary, getMyGames } from '../network/restClient';

export const RECENT_GAMES_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type RecentGames =
  | { status: typeof RECENT_GAMES_STATUS.LOADING }
  | { status: typeof RECENT_GAMES_STATUS.READY; games: GameSummary[] }
  | { status: typeof RECENT_GAMES_STATUS.ERROR };

type LoadedGames =
  { userId: string; games: GameSummary[] } | { userId: string; failed: true };

function isFinished(game: GameSummary): boolean {
  return game.status !== 'active';
}

function showsGamesFor(loaded: LoadedGames | null, userId: string): boolean {
  return loaded?.userId === userId && 'games' in loaded;
}

export function useRecentGames(limit: number): {
  recentGames: RecentGames;
  reload: () => void;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const [loaded, setLoaded] = useState<LoadedGames | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(() => {
    if (!userId) {
      return;
    }
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    authorized((accessToken) => getMyGames(accessToken, limit))
      .then((games) => ({ userId, games: games.filter(isFinished) }))
      .catch(() => ({ userId, failed: true as const }))
      .then((result) => {
        if (requestId === latestRequestId.current) {
          setLoaded((previous) =>
            'failed' in result && showsGamesFor(previous, userId)
              ? previous
              : result,
          );
        }
      });
  }, [userId, authorized, limit]);

  if (!loaded || loaded.userId !== userId) {
    return { recentGames: { status: RECENT_GAMES_STATUS.LOADING }, reload };
  }
  if ('failed' in loaded) {
    return { recentGames: { status: RECENT_GAMES_STATUS.ERROR }, reload };
  }
  return {
    recentGames: { status: RECENT_GAMES_STATUS.READY, games: loaded.games },
    reload,
  };
}

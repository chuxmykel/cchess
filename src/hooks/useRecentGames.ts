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
  | { accessToken: string; games: GameSummary[] }
  | { accessToken: string; failed: true };

function isFinished(game: GameSummary): boolean {
  return game.status !== 'active';
}

function showsGamesFor(
  loaded: LoadedGames | null,
  accessToken: string,
): boolean {
  return loaded?.accessToken === accessToken && 'games' in loaded;
}

export function useRecentGames(limit: number): {
  recentGames: RecentGames;
  reload: () => void;
} {
  const session = useAuthSession();
  const accessToken = session.isReady ? session.accessToken : null;
  const [loaded, setLoaded] = useState<LoadedGames | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(() => {
    if (!accessToken) {
      return;
    }
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    getMyGames(accessToken, limit)
      .then((games) => ({ accessToken, games: games.filter(isFinished) }))
      .catch(() => ({ accessToken, failed: true as const }))
      .then((result) => {
        if (requestId === latestRequestId.current) {
          setLoaded((previous) =>
            'failed' in result && showsGamesFor(previous, accessToken)
              ? previous
              : result,
          );
        }
      });
  }, [accessToken, limit]);

  if (!loaded || loaded.accessToken !== accessToken) {
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

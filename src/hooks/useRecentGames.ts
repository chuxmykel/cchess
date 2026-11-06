import { useCallback, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { GameSummary, getMyGames, getUserProfile } from '../network/restClient';

export const RECENT_GAMES_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type RecentGames =
  | { status: typeof RECENT_GAMES_STATUS.LOADING }
  | {
      status: typeof RECENT_GAMES_STATUS.READY;
      games: GameSummary[];
      /** Every game you've finished, or null when that couldn't be had. */
      total?: number | null;
    }
  | { status: typeof RECENT_GAMES_STATUS.ERROR };

type LoadedGames =
  | { userId: string; games: GameSummary[]; total: number | null }
  | { userId: string; failed: true };

function isFinished(game: GameSummary): boolean {
  return game.status !== 'active';
}

function showsGamesFor(loaded: LoadedGames | null, userId: string): boolean {
  return loaded?.userId === userId && 'games' in loaded;
}

// Your last finished games, and how many you've finished in all - your
// profile's count, asked for alongside; the games show without it.
export function useRecentGames(limit: number): {
  recentGames: RecentGames;
  reload: () => Promise<void>;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const username = session.isReady ? session.user.username : null;
  const [loaded, setLoaded] = useState<LoadedGames | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(() => {
    if (!userId) {
      return Promise.resolve();
    }
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    const total = authorized((accessToken) =>
      getUserProfile(username, accessToken),
    )
      .then((profile) => profile.gamesPlayed)
      .catch(() => null);
    return authorized((accessToken) => getMyGames(accessToken, limit))
      .then(async (games) => ({
        userId,
        games: games.filter(isFinished),
        total: await total,
      }))
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
  }, [userId, username, authorized, limit]);

  if (!loaded || loaded.userId !== userId) {
    return { recentGames: { status: RECENT_GAMES_STATUS.LOADING }, reload };
  }
  if ('failed' in loaded) {
    return { recentGames: { status: RECENT_GAMES_STATUS.ERROR }, reload };
  }
  return {
    recentGames: {
      status: RECENT_GAMES_STATUS.READY,
      games: loaded.games,
      total: loaded.total,
    },
    reload,
  };
}

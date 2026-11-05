import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { DailyGame, getDailyGames } from '../network/restClient';
import { GameMovePushPayload, GameSnapshot } from '../network/socketEvents';

export const DAILY_GAMES_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type DailyGames =
  | { status: typeof DAILY_GAMES_STATUS.LOADING }
  | { status: typeof DAILY_GAMES_STATUS.READY; games: DailyGame[] }
  | { status: typeof DAILY_GAMES_STATUS.ERROR };

type Loaded =
  { userId: string; games: DailyGame[] } | { userId: string; failed: true };

/**
 * The game after this one in a list of daily games, as the server orders
 * them - those on your move first - going round to the start; the first
 * when this one isn't listed (it's over, say). Null when there's no other.
 */
export function nextDailyGame(
  games: DailyGame[],
  currentGameId: string,
): DailyGame | null {
  const others = games.filter((game) => game.id !== currentGameId);
  if (others.length === 0) return null;
  const index = games.findIndex((game) => game.id === currentGameId);
  if (index === -1) return others[0];
  return games[(index + 1) % games.length];
}

/**
 * Your daily games in progress - at most `limit`, those on your move first,
 * then each by when its move runs out - as the server lists them. Fetched
 * again on `reload`, and whenever a push says one has moved, ended or
 * started, so the list keeps up with games played elsewhere.
 */
export function useDailyGames(limit?: number): {
  dailyGames: DailyGames;
  reload: () => void;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const socket = session.isReady ? session.socket : null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(() => {
    if (!userId) return;
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    authorized((accessToken) => getDailyGames(accessToken, limit))
      .then((games): Loaded => ({ userId, games }))
      .catch((): Loaded => ({ userId, failed: true }))
      .then((result) => {
        if (requestId !== latestRequestId.current) return;
        // A failed refresh keeps the list it had.
        setLoaded((previous) =>
          'failed' in result &&
          previous?.userId === userId &&
          'games' in previous
            ? previous
            : result,
        );
      });
  }, [userId, authorized, limit]);

  const games = loaded && 'games' in loaded ? loaded.games : null;
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  useEffect(() => {
    if (!socket) return;
    const isListed = (gameId: string) =>
      gamesRef.current?.some((game) => game.id === gameId) ?? false;
    function handleMove(payload: GameMovePushPayload) {
      if (isListed(payload.gameId)) reload();
    }
    function handleGame(payload: GameSnapshot) {
      if (payload.gameType === 'daily' || isListed(payload.id)) reload();
    }
    socket.on('game:move', handleMove);
    socket.on('game:over', handleGame);
    socket.on('game:created', handleGame);
    return () => {
      socket.off('game:move', handleMove);
      socket.off('game:over', handleGame);
      socket.off('game:created', handleGame);
    };
  }, [socket, reload]);

  if (!loaded || loaded.userId !== userId) {
    return { dailyGames: { status: DAILY_GAMES_STATUS.LOADING }, reload };
  }
  if ('failed' in loaded) {
    return { dailyGames: { status: DAILY_GAMES_STATUS.ERROR }, reload };
  }
  return {
    dailyGames: { status: DAILY_GAMES_STATUS.READY, games: loaded.games },
    reload,
  };
}

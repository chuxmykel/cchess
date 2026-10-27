import { useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';
import { GameSnapshot } from '../network/socketEvents';

export const GAME_SNAPSHOT_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
} as const;

export type GameSnapshotResult =
  | { status: typeof GAME_SNAPSHOT_STATUS.LOADING }
  | { status: typeof GAME_SNAPSHOT_STATUS.READY; snapshot: GameSnapshot };

// Joining a game's room fetches the authoritative current state (fen, turn,
// clocks, status, move history) via the game:state reply - confirmed live
// that this is the same full-Game-row shape as game:created/game:over. Every
// mount of the Game screen re-joins and trusts this reply over whatever
// navigation params it arrived with, so the screen also works if it's ever
// reached by resuming an in-progress game rather than fresh from a match.
export function useGameSnapshot(
  socket: AppSocket | null,
  gameId: string | null,
): GameSnapshotResult {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);

  useEffect(() => {
    if (!socket || !gameId) {
      return;
    }

    function handleState(payload: GameSnapshot) {
      if (payload.id === gameId) {
        setSnapshot(payload);
      }
    }

    function joinGame() {
      socket.emit('game:join', { gameId });
    }

    socket.on('game:state', handleState);
    socket.on('connect', joinGame);
    joinGame();

    return () => {
      socket.off('game:state', handleState);
      socket.off('connect', joinGame);
    };
  }, [socket, gameId]);

  const isSnapshotOfThisGame = snapshot !== null && snapshot.id === gameId;
  if (!isSnapshotOfThisGame) {
    return { status: GAME_SNAPSHOT_STATUS.LOADING };
  }
  return { status: GAME_SNAPSHOT_STATUS.READY, snapshot };
}

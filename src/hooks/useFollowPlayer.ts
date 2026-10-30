import { useEffect, useLayoutEffect, useRef } from 'react';

import { AppSocket } from '../network/socketClient';

// Follows a player while mounted: each game of theirs that starts is handed
// to onGameStarted, as the server pushes it. Following again after a
// reconnect, since the server forgets a socket's rooms when it drops.
export function useFollowPlayer(
  socket: AppSocket | null,
  userId: string | null,
  onGameStarted: (gameId: string) => void,
): void {
  const onGameStartedRef = useRef(onGameStarted);
  useLayoutEffect(() => {
    onGameStartedRef.current = onGameStarted;
  });

  useEffect(() => {
    if (!socket || !userId) {
      return;
    }
    function follow() {
      socket.emit('user:follow', { userId });
    }
    function handleGameStarted(payload: { userId: string; gameId: string }) {
      if (payload.userId === userId) {
        onGameStartedRef.current(payload.gameId);
      }
    }

    socket.on('user:gameStarted', handleGameStarted);
    socket.on('connect', follow);
    follow();
    return () => {
      socket.off('user:gameStarted', handleGameStarted);
      socket.off('connect', follow);
      socket.emit('user:unfollow', { userId });
    };
  }, [socket, userId]);
}

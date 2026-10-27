import { useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';
import { GamePresencePayload } from '../network/socketEvents';

// Whether the opponent is connected, as the server last said - assumed
// online until it says otherwise, so a fresh game doesn't flash "offline".
export function useOpponentPresence(
  socket: AppSocket,
  gameId: string,
  opponentId: string,
): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function handlePresence(payload: GamePresencePayload) {
      if (payload.gameId === gameId && payload.userId === opponentId) {
        setIsOnline(payload.online);
      }
    }
    socket.on('game:presence', handlePresence);
    return () => {
      socket.off('game:presence', handlePresence);
    };
  }, [socket, gameId, opponentId]);

  return isOnline;
}

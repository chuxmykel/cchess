import { useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';
import { LobbyStats } from '../network/socketEvents';

export function useLobbyStats(
  socket: AppSocket | null,
  isSeeking: boolean,
): LobbyStats | null {
  const [stats, setStats] = useState<LobbyStats | null>(null);

  useEffect(() => {
    if (!socket || !isSeeking) {
      return;
    }
    socket.on('lobby:stats', setStats);
    return () => {
      socket.off('lobby:stats', setStats);
      setStats(null);
    };
  }, [socket, isSeeking]);

  return stats;
}

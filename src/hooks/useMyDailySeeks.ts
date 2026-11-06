import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  cancelDailySeek,
  DailySeek,
  getMyDailySeeks,
} from '../network/restClient';
import { GameSnapshot } from '../network/socketEvents';

/**
 * Your daily seeks still waiting for an opponent - null until first loaded
 * - fetched again on `reload` and whenever a daily game starts, which one
 * of them may have. `cancel` withdraws one, dropping it at once.
 */
export function useMyDailySeeks(): {
  seeks: DailySeek[] | null;
  reload: () => Promise<void>;
  cancel: (seekId: string) => Promise<void>;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const socket = session.isReady ? session.socket : null;
  const [loaded, setLoaded] = useState<{
    userId: string;
    seeks: DailySeek[];
  } | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(() => {
    if (!userId) return Promise.resolve();
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    return (
      authorized(getMyDailySeeks)
        .then((seeks) => {
          if (requestId === latestRequestId.current) {
            setLoaded({ userId, seeks });
          }
        })
        // A failed refresh keeps what it had.
        .catch(() => {})
    );
  }, [userId, authorized]);

  useEffect(() => {
    if (!socket) return;
    function handleCreated(game: GameSnapshot) {
      if (game.gameType === 'daily') reload();
    }
    socket.on('game:created', handleCreated);
    return () => {
      socket.off('game:created', handleCreated);
    };
  }, [socket, reload]);

  const cancel = useCallback(
    async (seekId: string) => {
      await authorized((token) => cancelDailySeek(seekId, token));
      latestRequestId.current += 1;
      setLoaded(
        (current) =>
          current && {
            ...current,
            seeks: current.seeks.filter((seek) => seek.id !== seekId),
          },
      );
    },
    [authorized],
  );

  return {
    seeks: loaded?.userId === userId ? loaded.seeks : null,
    reload,
    cancel,
  };
}

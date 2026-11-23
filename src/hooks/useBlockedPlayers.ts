import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  BlockedUser,
  getBlockedUsers,
  unblockUser,
} from '../network/restClient';

export type BlockedPlayers = {
  /** Null while loading. */
  players: BlockedUser[] | null;
  error: string | null;
  reload: () => Promise<void>;
  /** Unblocks at once in the list, put back if the server refuses. */
  unblock: (player: BlockedUser) => Promise<void>;
};

export function useBlockedPlayers(): BlockedPlayers {
  const { authorized } = useAuthSession();
  const [players, setPlayers] = useState<BlockedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      authorized(getBlockedUsers)
        .then((blocked) => {
          setPlayers(blocked);
          setError(null);
        })
        .catch((failure: Error) => setError(failure.message)),
    [authorized],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const unblock = useCallback(
    async (player: BlockedUser) => {
      setPlayers((current) =>
        current ? current.filter((each) => each.id !== player.id) : current,
      );
      try {
        await authorized((token) => unblockUser(player.username, token));
      } catch (failure) {
        setError((failure as Error).message);
        await reload();
      }
    },
    [authorized, reload],
  );

  return { players, error, reload, unblock };
}

import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../context/AuthSessionContext';
import { blockUser, unblockUser } from '../network/restClient';

export type BlockTarget = { username: string; displayName: string };

export type Blocking = {
  /** Asks first, then blocks: resolves true once blocked, false if they
   * thought better of it. A failure rejects, with the server's reason. */
  confirmBlock: (target: BlockTarget) => Promise<boolean>;
  unblock: (username: string) => Promise<void>;
};

/** Blocking and unblocking a player, for a profile, a conversation or a
 * report. */
export function useBlocking(): Blocking {
  const { authorized } = useAuthSession();

  const confirmBlock = useCallback(
    (target: BlockTarget) =>
      new Promise<boolean>((resolve, reject) => {
        Alert.alert(
          `Block ${target.displayName}?`,
          "You won't be paired, and neither of you can send the other friend requests, challenges or messages. They aren't told.",
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () =>
                authorized((token) => blockUser(target.username, token))
                  .then(() => resolve(true))
                  .catch(reject),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      }),
    [authorized],
  );

  const unblock = useCallback(
    (username: string) => authorized((token) => unblockUser(username, token)),
    [authorized],
  );

  return { confirmBlock, unblock };
}

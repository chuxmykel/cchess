import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getUserFriends, UserFriend } from '../network/restClient';

export type UserFriendsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; friends: UserFriend[] };

// A player's friends - anyone's, not just your own - with their presence.
// With no player - a guest's own, who has none - nothing is fetched.
export function useUserFriends(username: string | null): {
  state: UserFriendsState;
  reload: () => Promise<void>;
} {
  const { authorized } = useAuthSession();
  const [state, setState] = useState<UserFriendsState>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    if (!username) return Promise.resolve();
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    return authorized((token) => getUserFriends(username, token))
      .then((friends) => {
        if (requestId === latestRequest.current) {
          setState({ status: 'ready', friends });
        }
      })
      .catch(() => {
        if (requestId === latestRequest.current) {
          setState((previous) =>
            previous.status === 'ready' ? previous : { status: 'error' },
          );
        }
      });
  }, [authorized, username]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}

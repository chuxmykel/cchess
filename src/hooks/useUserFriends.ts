import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getUserFriends, UserFriend } from '../network/restClient';

export type UserFriendsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; friends: UserFriend[] };

// A player's friends - anyone's, not just your own - with their presence.
export function useUserFriends(username: string): {
  state: UserFriendsState;
  reload: () => void;
} {
  const { authorized } = useAuthSession();
  const [state, setState] = useState<UserFriendsState>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    authorized((token) => getUserFriends(username, token))
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

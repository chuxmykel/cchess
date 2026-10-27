import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  ActivityDay,
  getUserActivity,
  getUserProfile,
  UserProfile,
} from '../network/restClient';

export type UserProfileState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; profile: UserProfile; activity: ActivityDay[] };

// Another player's profile and the last month of their games, as the
// signed-in player sees them.
export function useUserProfile(username: string): {
  state: UserProfileState;
  reload: () => void;
} {
  const { authorized } = useAuthSession();
  const [state, setState] = useState<UserProfileState>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    authorized((token) =>
      Promise.all([
        getUserProfile(username, token),
        getUserActivity(username, token),
      ]),
    )
      .then(([profile, activity]) => {
        if (requestId === latestRequest.current) {
          setState({ status: 'ready', profile, activity });
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

import { useEffect, useRef } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getMyActiveGame } from '../network/restClient';

// Sends the player back into a game still in progress - after the app
// restarts mid-game, say - once per account the app is signed in as.
export function useResumeActiveGame(onResume: (gameId: string) => void) {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const checkedUserId = useRef<string | null>(null);
  const latestOnResume = useRef(onResume);

  useEffect(() => {
    latestOnResume.current = onResume;
  }, [onResume]);

  useEffect(() => {
    if (!userId || checkedUserId.current === userId) return;
    checkedUserId.current = userId;
    let isCurrent = true;
    authorized(getMyActiveGame)
      .then((game) => {
        if (game && isCurrent) latestOnResume.current(game.id);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [authorized, userId]);
}

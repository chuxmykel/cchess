import { useEffect } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { analytics } from '../analytics/analytics';

/** Keeps analytics on the account signed in - by its ID alone - and back
 * to anonymous for a guest. */
export function useAnalyticsIdentity(): void {
  const session = useAuthSession();
  const userId =
    session.isReady && !session.user.isGuest ? session.user.id : null;
  useEffect(() => {
    if (userId) analytics.identify(userId);
    else analytics.reset();
  }, [userId]);
}

import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import type { Badge } from '../domain/badges';
import { getBadges } from '../network/restClient';

export type PlayerBadges = {
  // Their badges, the newest first - none until loaded, or if it fails
  // (they're an extra on the profile).
  badges: Badge[];
  reload: () => Promise<void>;
};

// A player's badges, from `GET /users/:username/badges`.
export function useBadges(username: string): PlayerBadges {
  const { authorized } = useAuthSession();
  const [loaded, setLoaded] = useState<{
    username: string;
    badges: Badge[];
  } | null>(null);

  const reload = useCallback(
    () =>
      authorized((token) => getBadges(username, token))
        .then((badges) => setLoaded({ username, badges }))
        .catch(() => {}),
    [authorized, username],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    badges: loaded?.username === username ? loaded.badges : NO_BADGES,
    reload,
  };
}

const NO_BADGES: Badge[] = [];

import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  type BadgeCounts,
  type Patterns,
  patternsOf,
} from '../domain/review/patterns';
import { getPatterns } from '../network/restClient';

export type PlayerPatterns = {
  // What keeps happening in their recent reviewed games - your own only:
  // the server sends nobody else's games. Null until loaded, or with none.
  patterns: Patterns | null;
  // The badges their reviewed games have earned, anyone's.
  badges: BadgeCounts;
  reload: () => Promise<void>;
};

// A profile's patterns and badges, from `GET /users/:username/patterns`.
// Shown without if it fails: they're extras on the profile.
export function usePlayerPatterns(username: string): PlayerPatterns {
  const { authorized } = useAuthSession();
  const [loaded, setLoaded] = useState<{
    username: string;
    patterns: Patterns | null;
    badges: BadgeCounts;
  } | null>(null);

  const reload = useCallback(
    () =>
      authorized((token) => getPatterns(username, token))
        .then(({ games, badges }) =>
          setLoaded({
            username,
            patterns: games.length > 0 ? patternsOf(games) : null,
            badges,
          }),
        )
        .catch(() => {}),
    [authorized, username],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const shown = loaded?.username === username ? loaded : null;
  return {
    patterns: shown?.patterns ?? null,
    badges: shown?.badges ?? {},
    reload,
  };
}

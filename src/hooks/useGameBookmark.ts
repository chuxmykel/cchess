import { useCallback, useEffect, useState } from 'react';

import { BOOKMARK_FAILED_MESSAGE } from '../constants/errorMessages';
import { useAuthSession } from '../context/AuthSessionContext';
import { isGameBookmarked, setGameBookmarked } from '../network/restClient';

export type UseGameBookmarkResult = {
  isBookmarked: boolean;
  toggleBookmark: () => Promise<void>;
};

// Whether you've bookmarked this game, toggled optimistically and put back
// if the server refuses.
export function useGameBookmark(
  gameId: string,
  onError?: (message: string) => void,
): UseGameBookmarkResult {
  const { authorized } = useAuthSession();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    authorized((accessToken) => isGameBookmarked(gameId, accessToken))
      .then((bookmarked) => {
        if (isCurrent) setIsBookmarked(bookmarked);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [gameId, authorized]);

  const toggleBookmark = useCallback(async () => {
    const wanted = !isBookmarked;
    setIsBookmarked(wanted);
    try {
      await authorized((accessToken) =>
        setGameBookmarked(gameId, wanted, accessToken),
      );
    } catch {
      setIsBookmarked(!wanted);
      onError?.(BOOKMARK_FAILED_MESSAGE);
    }
  }, [isBookmarked, gameId, authorized, onError]);

  return { isBookmarked, toggleBookmark };
}

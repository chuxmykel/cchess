import { useCallback } from 'react';
import { Share } from 'react-native';

import { SHARE_FAILED_MESSAGE } from '../constants/errorMessages';
import { useAuthSession } from '../context/AuthSessionContext';
import { getGamePgn } from '../network/restClient';

export function useGameShare(
  gameId: string,
  onError?: (message: string) => void,
): () => Promise<void> {
  const { authorized } = useAuthSession();

  return useCallback(async () => {
    try {
      const pgn = await authorized((accessToken) =>
        getGamePgn(gameId, accessToken),
      );
      await Share.share({ message: pgn });
    } catch {
      onError?.(SHARE_FAILED_MESSAGE);
    }
  }, [gameId, authorized, onError]);
}

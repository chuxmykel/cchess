import { useCallback } from 'react';
import { Share } from 'react-native';

import { SHARE_FAILED_MESSAGE } from '../constants/errorMessages';
import { useAuthSession } from '../context/AuthSessionContext';
import { getGamePgn } from '../network/restClient';

export function useGameShare(
  gameId: string,
  onError?: (message: string) => void,
): () => Promise<void> {
  const authSession = useAuthSession();
  const accessToken = authSession.isReady ? authSession.accessToken : null;

  return useCallback(async () => {
    if (!accessToken) {
      onError?.(SHARE_FAILED_MESSAGE);
      return;
    }
    try {
      const pgn = await getGamePgn(gameId, accessToken);
      await Share.share({ message: pgn });
    } catch {
      onError?.(SHARE_FAILED_MESSAGE);
    }
  }, [gameId, accessToken, onError]);
}

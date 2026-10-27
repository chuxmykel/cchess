import { useEffect, useLayoutEffect, useRef } from 'react';

import { MATCHMAKING_FAILED_MESSAGE } from '../constants/errorMessages';
import { Seek } from '../constants/seek';
import { GameSnapshot, MatchmakingErrorPayload } from '../network/socketEvents';
import { useAuthSession } from '../context/AuthSessionContext';

export type MatchmakingCallbacks = {
  onMatched: (gameId: string) => void;
  onError: (message: string) => void;
};

export type UseMatchmakingResult = {
  isConnecting: boolean;
};

export function useMatchmaking(
  seek: Seek | null,
  callbacks: MatchmakingCallbacks,
): UseMatchmakingResult {
  const authSession = useAuthSession();
  const socket = authSession.isReady ? authSession.socket : null;

  const callbacksRef = useRef(callbacks);
  useLayoutEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!socket || !seek) {
      return;
    }

    socket.emit('matchmaking:seek', {
      minutes: seek.timeControl.minutes,
      incrementSeconds: seek.timeControl.incrementSeconds,
      rated: seek.rated,
      ratingRange: seek.ratingRange,
    });

    function handleGameCreated(payload: GameSnapshot) {
      callbacksRef.current.onMatched(payload.id);
    }

    function handleMatchmakingError(payload: MatchmakingErrorPayload) {
      callbacksRef.current.onError(
        payload.message || MATCHMAKING_FAILED_MESSAGE,
      );
    }

    socket.on('game:created', handleGameCreated);
    socket.on('matchmaking:error', handleMatchmakingError);

    return () => {
      socket.emit('matchmaking:cancel');
      socket.off('game:created', handleGameCreated);
      socket.off('matchmaking:error', handleMatchmakingError);
    };
  }, [socket, seek]);

  return { isConnecting: !socket };
}

import { useEffect, useLayoutEffect, useRef } from 'react';

import { MATCHMAKING_FAILED_MESSAGE } from '../constants/errorMessages';
import { TimeControl } from '../constants/timeControls';
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
  timeControl: TimeControl | null,
  callbacks: MatchmakingCallbacks,
): UseMatchmakingResult {
  const authSession = useAuthSession();
  const socket = authSession.isReady ? authSession.socket : null;

  const callbacksRef = useRef(callbacks);
  useLayoutEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!socket || !timeControl) {
      return;
    }

    socket.emit('matchmaking:seek', {
      minutes: timeControl.minutes,
      incrementSeconds: timeControl.incrementSeconds,
      rated: false, // TODO: wire up once rated-game selection UI exists.
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
  }, [socket, timeControl]);

  return { isConnecting: !socket };
}

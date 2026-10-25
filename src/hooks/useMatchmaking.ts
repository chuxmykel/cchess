import { useEffect } from 'react';

import { MATCHMAKING_FAILED_MESSAGE } from '../constants/errorMessages';
import { TimeControl } from '../constants/timeControls';
import { GameSnapshot, MatchmakingErrorPayload } from '../network/socketEvents';
import { useAuthSession } from '../context/AuthSessionContext';
import { ToastItem, useToast } from './useToast';

type MatchmakingNavigation = {
  replace: (screen: 'LiveGame', params: { gameId: string }) => void;
  goBack: () => void;
};

export type UseMatchmakingResult = {
  toasts: ToastItem[];
  isConnecting: boolean;
  cancel: () => void;
};

// Drives the Matchmaking screen: seeks on mount using the live socket,
// navigates into LiveGame once matched, and cancels the seek on cleanup -
// covers both the explicit Cancel button and any other way the screen
// unmounts (e.g. the hardware back gesture before it's matched).
export function useMatchmaking(
  navigation: MatchmakingNavigation,
  timeControl: TimeControl,
): UseMatchmakingResult {
  const authSession = useAuthSession();
  const toast = useToast();
  const socket = authSession.isReady ? authSession.socket : null;

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit('matchmaking:seek', {
      minutes: timeControl.minutes,
      incrementSeconds: timeControl.incrementSeconds,
      rated: false, // TODO: wire up once rated-game selection UI exists.
    });

    function handleGameCreated(payload: GameSnapshot) {
      // LiveGame re-fetches this same snapshot itself via game:join on mount
      // (see useGameSnapshot), so only the id needs to cross navigation.
      navigation.replace('LiveGame', { gameId: payload.id });
    }

    function handleMatchmakingError(payload: MatchmakingErrorPayload) {
      toast.show(payload.message || MATCHMAKING_FAILED_MESSAGE);
      cancel();
    }

    socket.on('game:created', handleGameCreated);
    socket.on('matchmaking:error', handleMatchmakingError);

    return () => {
      socket.emit('matchmaking:cancel');
      socket.off('game:created', handleGameCreated);
      socket.off('matchmaking:error', handleMatchmakingError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  function cancel(): void {
    navigation.goBack();
  }

  return {
    toasts: toast.toasts,
    isConnecting: !socket,
    cancel,
  };
}

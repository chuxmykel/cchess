import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Color } from 'chess.js';

import { AppSocket } from '../network/socketClient';
import { GameSnapshot, RematchPayload } from '../network/socketEvents';

/** Where a finished game's rematch stands, from this player's side. */
export type RematchStatus = 'none' | 'offered' | 'received' | 'declined';

export type UseRematchResult = {
  status: RematchStatus;
  offer: () => void;
  /** Declines the opponent's offer, or withdraws our own. */
  decline: () => void;
};

function statusFrom(
  offeredBy: GameSnapshot['rematchOfferedBy'],
  mySide: 'white' | 'black',
): RematchStatus {
  if (offeredBy === null) return 'none';
  return offeredBy === mySide ? 'offered' : 'received';
}

// A finished game's rematch: offering one, answering the opponent's, and
// - once both have offered and the server starts it - handing over the
// new game (its game:created names this one as what it rematches).
export function useRematch(
  socket: AppSocket,
  snapshot: GameSnapshot,
  myColor: Color,
  onRematchStarted?: (gameId: string) => void,
): UseRematchResult {
  const gameId = snapshot.id;
  const mySide = myColor === 'w' ? 'white' : 'black';
  const [status, setStatus] = useState<RematchStatus>(() =>
    statusFrom(snapshot.rematchOfferedBy, mySide),
  );
  const latestOnRematchStarted = useRef(onRematchStarted);
  useLayoutEffect(() => {
    latestOnRematchStarted.current = onRematchStarted;
  });

  useEffect(() => {
    function handleOffered(payload: RematchPayload) {
      if (payload.gameId !== gameId) return;
      setStatus(payload.by === mySide ? 'offered' : 'received');
    }

    function handleDeclined(payload: RematchPayload) {
      if (payload.gameId !== gameId) return;
      // The opponent turning down our offer is worth saying; anything else
      // - our own decline or withdrawal, or theirs - just clears the offer.
      setStatus((previous) =>
        previous === 'offered' && payload.by !== mySide ? 'declined' : 'none',
      );
    }

    function handleCreated(rematch: GameSnapshot) {
      if (rematch.rematchOfId === gameId) {
        latestOnRematchStarted.current?.(rematch.id);
      }
    }

    socket.on('game:rematchOffered', handleOffered);
    socket.on('game:rematchDeclined', handleDeclined);
    socket.on('game:created', handleCreated);
    return () => {
      socket.off('game:rematchOffered', handleOffered);
      socket.off('game:rematchDeclined', handleDeclined);
      socket.off('game:created', handleCreated);
    };
  }, [socket, gameId, mySide]);

  return {
    status,
    offer: () => socket.emit('game:rematchOffer', { gameId }),
    decline: () => socket.emit('game:rematchDecline', { gameId }),
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Color, Square } from 'chess.js';

import { isPromotionPremove, premoveTargets } from '../domain/premoveTargets';
import { LegalTargets } from '../domain/types';
import { AppSocket } from '../network/socketClient';
import {
  GameErrorPayload,
  GameMovePushPayload,
  GameSnapshot,
} from '../network/socketEvents';

export type QueuedPremove = { from: Square; to: Square };

/** What a board needs to queue a move on the opponent's turn. */
export type Premovable = {
  color: Color;
  dests: LegalTargets;
  current: QueuedPremove | null;
};

export type PremoveControls = {
  /** Null while it's my turn, or the game's over: nothing to queue. */
  premovable: Premovable | null;
  setPremove: (from: Square, to: Square) => void;
  cancelPremove: () => void;
};

// A move queued on the opponent's turn. The server holds it and plays it
// the moment their move lands - so it costs the same 0.1s on any
// connection - or drops it if it's no longer legal; either way it's gone
// here once their move arrives. One at a time: a new one replaces it.
export function usePremove(
  socket: AppSocket,
  gameId: string,
  myColor: Color,
  fen: string,
  turn: Color,
  isActive: boolean,
): PremoveControls {
  const [current, setCurrent] = useState<QueuedPremove | null>(null);
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    function handleMove(payload: GameMovePushPayload) {
      if (payload.gameId === gameId && payload.move.color !== myColor) {
        setCurrent(null);
      }
    }
    function handleOver(payload: GameSnapshot) {
      if (payload.id === gameId) setCurrent(null);
    }
    // Back after a reconnect: whatever the server still holds may no
    // longer be what's wanted, from a position since moved on.
    function handleState(payload: GameSnapshot) {
      if (payload.id !== gameId || !currentRef.current) return;
      socket.emit('game:premoveCancel', { gameId });
      setCurrent(null);
    }
    function handleError(payload: GameErrorPayload) {
      if (payload.gameId === gameId && payload.event === 'game:premove') {
        setCurrent(null);
      }
    }

    socket.on('game:move', handleMove);
    socket.on('game:over', handleOver);
    socket.on('game:state', handleState);
    socket.on('game:error', handleError);
    return () => {
      socket.off('game:move', handleMove);
      socket.off('game:over', handleOver);
      socket.off('game:state', handleState);
      socket.off('game:error', handleError);
    };
  }, [socket, gameId, myColor]);

  const waiting = isActive && turn !== myColor;
  const dests = useMemo(
    () => (waiting ? premoveTargets(fen, myColor) : null),
    [waiting, fen, myColor],
  );
  // Once it's my turn there's nothing queued: the opponent's move took it.
  const shown = waiting ? current : null;
  const premovable = useMemo(
    () => dests && { color: myColor, dests, current: shown },
    [dests, myColor, shown],
  );

  const setPremove = useCallback(
    (from: Square, to: Square) => {
      // Decided before the moment comes: a queen.
      const promotion = isPromotionPremove(fen, from, to) ? 'q' : undefined;
      socket.emit('game:premove', { gameId, from, to, promotion });
      setCurrent({ from, to });
    },
    [socket, gameId, fen],
  );

  const cancelPremove = useCallback(() => {
    socket.emit('game:premoveCancel', { gameId });
    setCurrent(null);
  }, [socket, gameId]);

  return { premovable, setPremove, cancelPremove };
}

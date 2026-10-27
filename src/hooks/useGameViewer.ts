import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getGame } from '../network/restClient';
import { GameMovePushPayload, GameSnapshot } from '../network/socketEvents';

/** Each side's clock as it stood after `ply` half-moves. */
export function clocksAtPly(
  snapshot: GameSnapshot,
  ply: number,
): { whiteMs: number; blackMs: number } {
  if (ply >= snapshot.moves.length) {
    return {
      whiteMs: snapshot.whiteTimeRemainingMs,
      blackMs: snapshot.blackTimeRemainingMs,
    };
  }
  const startingMs = snapshot.minutes * 60_000;
  const clocks = { whiteMs: startingMs, blackMs: startingMs };
  for (const move of snapshot.moves.slice(0, ply)) {
    if (move.color === 'w') clocks.whiteMs = move.clockAfterMs;
    else clocks.blackMs = move.clockAfterMs;
  }
  return clocks;
}

export type GameViewerState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: GameSnapshot };

function withMove(
  snapshot: GameSnapshot,
  push: GameMovePushPayload,
): GameSnapshot {
  if (snapshot.moves.some((move) => move.ply === push.move.ply)) {
    return snapshot;
  }
  return {
    ...snapshot,
    moves: [...snapshot.moves, push.move],
    fen: push.fen,
    turn: push.turn,
    whiteTimeRemainingMs: push.whiteTimeRemainingMs,
    blackTimeRemainingMs: push.blackTimeRemainingMs,
    firstMoveDeadline: push.firstMoveDeadline,
  };
}

// One game to look through: fetched once, and for a game still being
// played, watched so its moves and result arrive as they happen.
export function useGameViewer(gameId: string): {
  state: GameViewerState;
  reload: () => void;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const socket = session.isReady ? session.socket : null;
  const [state, setState] = useState<GameViewerState>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    authorized((token) => getGame(gameId, token))
      .then((snapshot) => {
        if (requestId === latestRequest.current) {
          setState({ status: 'ready', snapshot });
        }
      })
      .catch(() => {
        if (requestId === latestRequest.current) {
          setState((previous) =>
            previous.status === 'ready' ? previous : { status: 'error' },
          );
        }
      });
  }, [authorized, gameId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const isActive =
    state.status === 'ready' && state.snapshot.status === 'active';

  useEffect(() => {
    if (!socket || !isActive) {
      return;
    }
    function watch() {
      socket.emit('game:watch', { gameId });
    }
    function replaceSnapshot(snapshot: GameSnapshot) {
      if (snapshot.id === gameId) {
        setState({ status: 'ready', snapshot });
      }
    }
    function handleMove(push: GameMovePushPayload) {
      if (push.gameId !== gameId) {
        return;
      }
      setState((current) =>
        current.status === 'ready'
          ? { status: 'ready', snapshot: withMove(current.snapshot, push) }
          : current,
      );
    }

    socket.on('game:state', replaceSnapshot);
    socket.on('game:move', handleMove);
    socket.on('game:over', replaceSnapshot);
    socket.on('connect', watch);
    watch();
    return () => {
      socket.off('game:state', replaceSnapshot);
      socket.off('game:move', handleMove);
      socket.off('game:over', replaceSnapshot);
      socket.off('connect', watch);
      socket.emit('game:unwatch', { gameId });
    };
  }, [socket, gameId, isActive]);

  return { state, reload };
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Color } from 'chess.js';

import { AppSocket } from '../network/socketClient';
import {
  DrawOfferedPayload,
  GameErrorPayload,
  GameMovePushPayload,
  GameResultReason,
  GameSnapshot,
} from '../network/socketEvents';
import { UseChessGameResult } from './useChessGame';

export type GameStatus = 'active' | 'completed' | 'aborted';

export type GameServerEventsResult = {
  gameStatus: GameStatus;
  result: 'white' | 'black' | 'draw' | null;
  resultReason: GameResultReason | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  drawOfferedBy: Color | null;
  clearDrawOffer: () => void;
};

// Reflects the server's view of an in-progress game into local state -
// status/result/reason, both clocks, draw offers, and errors - and replays
// an incoming opponent move onto the local engine. A game:move's fen is only
// actually replayed when it doesn't already match ours - true for the
// opponent's moves, false for the echo of our own (confirmed live that the
// server pushes our own submitted move back to us) - which is what makes
// this idempotent without tracking ply numbers separately.
export function useGameServerEvents(
  socket: AppSocket,
  gameId: string,
  snapshot: GameSnapshot,
  game: UseChessGameResult,
  onError?: (message: string) => void,
): GameServerEventsResult {
  const [gameStatus, setGameStatus] = useState<GameStatus>(snapshot.status);
  const [result, setResult] = useState(snapshot.result);
  const [resultReason, setResultReason] = useState(snapshot.resultReason);
  const [clocks, setClocks] = useState({
    whiteTimeMs: snapshot.whiteTimeRemainingMs,
    blackTimeMs: snapshot.blackTimeRemainingMs,
  });
  const [drawOfferedBy, setDrawOfferedBy] = useState(snapshot.drawOfferedBy);

  const gameRef = useRef(game);
  useLayoutEffect(() => {
    gameRef.current = game;
  });

  useEffect(() => {
    function handleMove(payload: GameMovePushPayload) {
      if (payload.gameId !== gameId) {
        return;
      }
      setClocks({
        whiteTimeMs: payload.whiteTimeRemainingMs,
        blackTimeMs: payload.blackTimeRemainingMs,
      });
      if (payload.fen === gameRef.current.fen) {
        return; // the echo of a move we already applied optimistically
      }
      const moveResult = gameRef.current.attemptMove(
        payload.move.from,
        payload.move.to,
      );
      if (
        moveResult.status === 'needs-promotion-choice' &&
        payload.move.promotion
      ) {
        gameRef.current.promoteTo(payload.move.promotion);
      }
    }

    function handleOver(payload: GameSnapshot) {
      if (payload.id !== gameId) {
        return;
      }
      setGameStatus(payload.status);
      setResult(payload.result);
      setResultReason(payload.resultReason);
      setClocks({
        whiteTimeMs: payload.whiteTimeRemainingMs,
        blackTimeMs: payload.blackTimeRemainingMs,
      });
    }

    function handleDrawOffered(payload: DrawOfferedPayload) {
      if (payload.gameId === gameId) {
        setDrawOfferedBy(payload.by);
      }
    }

    function handleDrawDeclined(payload: { gameId: string }) {
      if (payload.gameId === gameId) {
        setDrawOfferedBy(null);
      }
    }

    function handleError(payload: GameErrorPayload) {
      if (payload.gameId === gameId) {
        onError?.(payload.message);
      }
    }

    socket.on('game:move', handleMove);
    socket.on('game:over', handleOver);
    socket.on('game:drawOffered', handleDrawOffered);
    socket.on('game:drawDeclined', handleDrawDeclined);
    socket.on('game:error', handleError);

    return () => {
      socket.off('game:move', handleMove);
      socket.off('game:over', handleOver);
      socket.off('game:drawOffered', handleDrawOffered);
      socket.off('game:drawDeclined', handleDrawDeclined);
      socket.off('game:error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, gameId]);

  function clearDrawOffer(): void {
    setDrawOfferedBy(null);
  }

  return {
    gameStatus,
    result,
    resultReason,
    whiteTimeMs: clocks.whiteTimeMs,
    blackTimeMs: clocks.blackTimeMs,
    drawOfferedBy,
    clearDrawOffer,
  };
}

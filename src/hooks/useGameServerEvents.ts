import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Color } from 'chess.js';

import { AppSocket } from '../network/socketClient';
import {
  DrawOfferedPayload,
  GameErrorPayload,
  GameMoveSummary,
  GameMovePushPayload,
  GameResultReason,
  GameSnapshot,
  SeriesScore,
  Side,
} from '../network/socketEvents';
import { UseChessGameResult } from './useChessGame';

export type GameStatus = 'active' | 'completed' | 'aborted';

/** The server names sides 'white'/'black'; the board works in Colors. */
function colorOf(side: Side | null): Color | null {
  if (side === null) return null;
  return side === 'white' ? 'w' : 'b';
}

export type GameServerEventsResult = {
  gameStatus: GameStatus;
  result: 'white' | 'black' | 'draw' | null;
  resultReason: GameResultReason | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  drawOfferedBy: Color | null;
  firstMoveDeadline: string | null;
  moves: GameMoveSummary[];
  whiteRatingDiff: number | null;
  blackRatingDiff: number | null;
  /** The rematch series score, updated when the game ends. */
  series: SeriesScore | null;
  clearDrawOffer: () => void;
};

// Reflects the server's view of an in-progress game into local state -
// status/result/reason, both clocks, draw offers, and errors - and replays
// an incoming opponent move onto the local engine. A game:move's fen is only
// actually replayed when it doesn't already match ours - true for the
// opponent's moves, false for the echo of our own (confirmed live that the
// server pushes our own submitted move back to us) - which is what makes
// this idempotent without tracking ply numbers separately. A move of ours
// the server refuses is taken back, to the last position it confirmed.
function withMoveAdded(
  moves: GameMoveSummary[],
  move: GameMoveSummary,
): GameMoveSummary[] {
  const alreadyHasMove = moves.some(({ ply }) => ply === move.ply);
  return alreadyHasMove ? moves : [...moves, move];
}

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
  const [drawOfferedBy, setDrawOfferedBy] = useState(
    colorOf(snapshot.drawOfferedBy),
  );

  const [firstMoveDeadline, setFirstMoveDeadline] = useState(
    snapshot.firstMoveDeadline,
  );
  const [moves, setMoves] = useState<GameMoveSummary[]>(snapshot.moves);
  const [ratingDiffs, setRatingDiffs] = useState({
    whiteRatingDiff: snapshot.whiteRatingDiff,
    blackRatingDiff: snapshot.blackRatingDiff,
  });

  const [series, setSeries] = useState(snapshot.series);

  const gameRef = useRef(game);
  useLayoutEffect(() => {
    gameRef.current = game;
  });
  // The position as the server last confirmed it; ours runs a move ahead
  // while one of our moves awaits its echo.
  const confirmedFenRef = useRef(snapshot.fen);

  useEffect(() => {
    function handleMove(payload: GameMovePushPayload) {
      if (payload.gameId !== gameId) {
        return;
      }
      setClocks({
        whiteTimeMs: payload.whiteTimeRemainingMs,
        blackTimeMs: payload.blackTimeRemainingMs,
      });
      setFirstMoveDeadline(payload.firstMoveDeadline);
      setMoves((previous) => withMoveAdded(previous, payload.move));
      // Any move lapses a draw offer, as it does on the server.
      setDrawOfferedBy(null);
      confirmedFenRef.current = payload.fen;
      if (payload.fen === gameRef.current.fen) {
        return; // the echo of a move we already applied optimistically
      }
      // The promotion piece goes in with the move: asking for it would
      // show this player the promotion menu for the opponent's pawn.
      gameRef.current.attemptMove(
        payload.move.from,
        payload.move.to,
        payload.move.promotion ?? undefined,
      );
    }

    function handleOver(payload: GameSnapshot) {
      if (payload.id !== gameId) {
        return;
      }
      setGameStatus(payload.status);
      setFirstMoveDeadline(null);
      setResult(payload.result);
      setResultReason(payload.resultReason);
      setClocks({
        whiteTimeMs: payload.whiteTimeRemainingMs,
        blackTimeMs: payload.blackTimeRemainingMs,
      });
      setRatingDiffs({
        whiteRatingDiff: payload.whiteRatingDiff,
        blackRatingDiff: payload.blackRatingDiff,
      });
      setSeries(payload.series);
    }

    function handleDrawOffered(payload: DrawOfferedPayload) {
      if (payload.gameId === gameId) {
        setDrawOfferedBy(colorOf(payload.by));
      }
    }

    function handleDrawDeclined(payload: { gameId: string }) {
      if (payload.gameId === gameId) {
        setDrawOfferedBy(null);
      }
    }

    function handleError(payload: GameErrorPayload) {
      if (payload.gameId !== gameId) {
        return;
      }
      if (
        payload.event === 'game:move' &&
        gameRef.current.fen !== confirmedFenRef.current
      ) {
        gameRef.current.resetTo(confirmedFenRef.current);
      }
      onError?.(payload.message);
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
    firstMoveDeadline,
    moves,
    ...ratingDiffs,
    series,
    clearDrawOffer,
  };
}

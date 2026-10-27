import { useEffect } from 'react';
import { Color, Square } from 'chess.js';

import { MoveResult } from '../domain/types';
import { plyCountFromFen } from '../domain/fen';
import { AppSocket } from '../network/socketClient';
import {
  GameMoveSummary,
  GameResultReason,
  GameSnapshot,
} from '../network/socketEvents';
import { useChessGame, UseChessGameResult } from './useChessGame';
import { GameStatus, useGameServerEvents } from './useGameServerEvents';

export type { GameStatus };

export type UseOnlineChessGameResult = Omit<
  UseChessGameResult,
  'isGameOver' | 'attemptMove' | 'handleSquareTap'
> & {
  myColor: Color;
  isGameOver: boolean;
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
  canAbort: boolean;
  attemptMove: (from: Square, to: Square) => MoveResult;
  handleSquareTap: (square: Square) => void;
  resign: () => void;
  offerDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  abort: () => void;
};

const SERVER_ABORT_PLY_LIMIT = 2;

export function useOnlineChessGame(
  socket: AppSocket,
  gameId: string,
  myColor: Color,
  snapshot: GameSnapshot,
  onError?: (message: string) => void,
): UseOnlineChessGameResult {
  const game = useChessGame(snapshot.fen);

  const {
    gameStatus,
    result,
    resultReason,
    whiteTimeMs,
    blackTimeMs,
    drawOfferedBy,
    firstMoveDeadline,
    moves,
    whiteRatingDiff,
    blackRatingDiff,
    clearDrawOffer,
  } = useGameServerEvents(socket, gameId, snapshot, game, onError);

  const pliesPlayedIncludingOurUnconfirmedMove = plyCountFromFen(game.fen);
  const canAbort =
    gameStatus === 'active' &&
    pliesPlayedIncludingOurUnconfirmedMove < SERVER_ABORT_PLY_LIMIT;

  useEffect(() => {
    if (game.lastMove && game.lastMove.color === myColor) {
      socket.emit('game:move', {
        gameId,
        from: game.lastMove.from,
        to: game.lastMove.to,
        promotion: game.lastMove.promotionPiece,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.lastMove]);

  function canAct(): boolean {
    return gameStatus === 'active' && game.turn === myColor;
  }

  function attemptMove(from: Square, to: Square): MoveResult {
    if (!canAct()) {
      return { status: 'illegal' };
    }
    return game.attemptMove(from, to);
  }

  function handleSquareTap(square: Square): void {
    if (!canAct()) {
      return;
    }
    game.handleSquareTap(square);
  }

  function resign(): void {
    socket.emit('game:resign', { gameId });
  }

  function offerDraw(): void {
    socket.emit('game:drawOffer', { gameId });
  }

  function respondToDraw(accept: boolean): void {
    socket.emit('game:drawRespond', { gameId, accept });
    clearDrawOffer();
  }

  function abort(): void {
    socket.emit('game:abort', { gameId });
  }

  return {
    ...game,
    myColor,
    isGameOver: gameStatus !== 'active',
    gameStatus,
    result,
    resultReason,
    whiteTimeMs,
    blackTimeMs,
    drawOfferedBy,
    firstMoveDeadline,
    moves,
    whiteRatingDiff,
    blackRatingDiff,
    canAbort,
    attemptMove,
    handleSquareTap,
    resign,
    offerDraw,
    respondToDraw,
    abort,
  };
}

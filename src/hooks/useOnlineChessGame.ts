import { useEffect, useState } from 'react';
import { Color, Square } from 'chess.js';

import { MoveResult } from '../domain/types';
import { plyCountFromFen } from '../domain/fen';
import { AppSocket } from '../network/socketClient';
import {
  GameMoveSummary,
  GameResultReason,
  GameSnapshot,
  SeriesScore,
} from '../network/socketEvents';
import { useChessGame, UseChessGameResult } from './useChessGame';
import { GameStatus, useGameServerEvents } from './useGameServerEvents';
import { useOpponentPresence } from './useOpponentPresence';
import { useGameChat, UseGameChatResult } from './useGameChat';
import {
  useGameOverSound,
  useGameStartSound,
  useMoveSounds,
} from './useGameSounds';
import { useRematch, UseRematchResult } from './useRematch';

export type { GameStatus };

export type GameChat = UseGameChatResult & {
  myUserId: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export type UseOnlineChessGameResult = Omit<
  UseChessGameResult,
  'isGameOver' | 'attemptMove' | 'handleSquareTap' | 'isOwnPieceAt'
> & {
  myColor: Color;
  isGameOver: boolean;
  gameStatus: GameStatus;
  result: 'white' | 'black' | 'draw' | null;
  resultReason: GameResultReason | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  drawOfferedBy: Color | null;
  /** A draw offer waiting for an answer: one I've sent, or received. */
  drawOffer: DrawOfferStatus;
  firstMoveDeadline: string | null;
  moves: GameMoveSummary[];
  whiteRatingDiff: number | null;
  blackRatingDiff: number | null;
  /** The rematch series score; null outside a series. */
  series: SeriesScore | null;
  rematch: UseRematchResult;
  canAbort: boolean;
  isOpponentOnline: boolean;
  chat: GameChat;
  attemptMove: (from: Square, to: Square) => MoveResult;
  handleSquareTap: (square: Square) => void;
  /** Whether the piece on a square is mine to touch: my pieces, on my
   * turn, while the game is on. */
  isOwnPieceAt: (square: Square) => boolean;
  resign: () => void;
  offerDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  abort: () => void;
};

export type DrawOfferStatus = 'none' | 'sent' | 'received';

const SERVER_ABORT_PLY_LIMIT = 2;

export function useOnlineChessGame(
  socket: AppSocket,
  gameId: string,
  myColor: Color,
  snapshot: GameSnapshot,
  onError?: (message: string) => void,
  onRematchStarted?: (gameId: string) => void,
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
    series,
    clearDrawOffer,
  } = useGameServerEvents(socket, gameId, snapshot, game, onError);
  let drawOffer: DrawOfferStatus = 'none';
  if (drawOfferedBy === myColor) drawOffer = 'sent';
  else if (drawOfferedBy) drawOffer = 'received';
  const rematch = useRematch(socket, snapshot, myColor, onRematchStarted);
  const opponent = myColor === 'w' ? snapshot.black : snapshot.white;
  const isOpponentOnline = useOpponentPresence(socket, gameId, opponent.id);
  const myUserId = myColor === 'w' ? snapshot.white.id : snapshot.black.id;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatMessages = useGameChat(socket, gameId, myUserId, isChatOpen);

  const pliesPlayedIncludingOurUnconfirmedMove = plyCountFromFen(game.fen);
  const canAbort =
    gameStatus === 'active' &&
    pliesPlayedIncludingOurUnconfirmedMove < SERVER_ABORT_PLY_LIMIT;

  useGameStartSound(
    snapshot.status === 'active' && snapshot.moves.length === 0,
  );
  useMoveSounds(game.lastMove);
  useGameOverSound(gameStatus !== 'active', resultReason);

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

  // The board lets a piece be picked up - and shows its moves - when this
  // says so. Left to the local game alone it would answer for the side to
  // move, so on the opponent's turn their pieces would show moves to me.
  function isOwnPieceAt(square: Square): boolean {
    return canAct() && game.isOwnPieceAt(square);
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
    drawOffer,
    firstMoveDeadline,
    moves,
    whiteRatingDiff,
    blackRatingDiff,
    series,
    rematch,
    canAbort,
    isOpponentOnline,
    chat: {
      ...chatMessages,
      myUserId,
      isOpen: isChatOpen,
      open: () => setIsChatOpen(true),
      close: () => setIsChatOpen(false),
    },
    attemptMove,
    handleSquareTap,
    isOwnPieceAt,
    resign,
    offerDraw,
    respondToDraw,
    abort,
  };
}

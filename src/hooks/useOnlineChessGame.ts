import { useEffect } from 'react';
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
import { GameChat, useGameChatSheet } from './useGameChat';
import {
  useGameOverSound,
  useGameStartSound,
  useMoveSounds,
} from './useGameSounds';
import { useRematch, UseRematchResult } from './useRematch';
import { PremoveControls, usePremove } from './usePremove';

export type { GameStatus };

export type UseOnlineChessGameResult = Omit<
  UseChessGameResult,
  'isGameOver' | 'attemptMove' | 'movableColor'
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
  /** Whose pieces can be picked up: mine, on my turn, while the game is
   * on - nobody's otherwise. */
  movableColor: Color | null;
  resign: () => void;
  offerDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  abort: () => void;
} & PremoveControls;

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
  // Days apart, a daily game's moves take no pre-moves, nor start with the
  // sound of a game beginning each time one not yet begun is opened.
  const isDaily = snapshot.gameType === 'daily';

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
    isConfirmed,
  } = useGameServerEvents(socket, gameId, snapshot, game, onError);
  const { premovable, setPremove, cancelPremove } = usePremove(
    socket,
    gameId,
    myColor,
    game.fen,
    game.turn,
    gameStatus === 'active' && !isDaily,
  );
  let drawOffer: DrawOfferStatus = 'none';
  if (drawOfferedBy === myColor) drawOffer = 'sent';
  else if (drawOfferedBy) drawOffer = 'received';
  const rematch = useRematch(socket, snapshot, myColor, onRematchStarted);
  const opponent = myColor === 'w' ? snapshot.black : snapshot.white;
  const isOpponentOnline = useOpponentPresence(socket, gameId, opponent.id);
  const myUserId = myColor === 'w' ? snapshot.white.id : snapshot.black.id;
  const chat = useGameChatSheet(socket, gameId, myUserId);

  const pliesPlayedIncludingOurUnconfirmedMove = plyCountFromFen(game.fen);
  const canAbort =
    gameStatus === 'active' &&
    pliesPlayedIncludingOurUnconfirmedMove < SERVER_ABORT_PLY_LIMIT;

  useGameStartSound(
    !isDaily && snapshot.status === 'active' && snapshot.moves.length === 0,
  );
  useMoveSounds(game.lastMove);
  useGameOverSound(gameStatus !== 'active', resultReason);

  useEffect(() => {
    // Not one the server played for us - a pre-move - and sent back.
    if (
      game.lastMove &&
      game.lastMove.color === myColor &&
      !isConfirmed(game.fen)
    ) {
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

  // The board lets a piece be picked up - and shows its moves - when this
  // says so. Left to the local game alone it would answer for the side to
  // move, so on the opponent's turn their pieces would show moves to me.
  const movableColor = canAct() ? myColor : null;

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
    chat,
    attemptMove,
    movableColor,
    resign,
    offerDraw,
    respondToDraw,
    abort,
    premovable,
    setPremove,
    cancelPremove,
  };
}

import { Chess } from 'chess.js';

import { GameMoveSummary, GameSnapshot } from '../network/socketEvents';

export const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// A full, legal starting-position GameSnapshot with sensible defaults for
// every field a test doesn't care about - pass overrides for the ones it does.
export function makeGameSnapshot(
  overrides: Partial<GameSnapshot> = {},
): GameSnapshot {
  return {
    id: 'game-1',
    white: {
      id: 'white-user',
      username: 'white',
      displayName: 'White',
      avatarColor: '#fff',
      rating: null,
      provisional: false,
    },
    black: {
      id: 'black-user',
      username: 'black',
      displayName: 'Black',
      avatarColor: '#000',
      rating: null,
      provisional: false,
    },
    initialSeconds: 300,
    incrementSeconds: 0,
    gameType: 'blitz',
    rated: false,
    whiteRatingDiff: null,
    blackRatingDiff: null,
    status: 'active',
    result: null,
    resultReason: null,
    fen: STARTING_FEN,
    turn: 'w',
    whiteTimeRemainingMs: 300000,
    blackTimeRemainingMs: 300000,
    lastMoveAt: null,
    drawOfferedBy: null,
    moves: [],
    firstMoveDeadline: null,
    daysPerMove: null,
    moveDeadlineAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    endedAt: null,
    chatClosesAt: null,
    rematchOfId: null,
    series: null,
    rematchOfferedBy: null,
    rematchGameId: null,
    ...overrides,
  };
}

// A game's moves as the server sends them, from SAN played out from the
// start.
export function movesFromSan(sans: string[]): GameMoveSummary[] {
  const chess = new Chess();
  return sans.map((san, index) => {
    const move = chess.move(san);
    return {
      ply: index + 1,
      from: move.from,
      to: move.to,
      piece: move.piece,
      color: move.color,
      san: move.san,
      captured: move.captured ?? null,
      promotion: move.promotion ?? null,
      fenAfter: move.after,
      clockAfterMs: 300_000,
    };
  });
}

// A game played to its end - resigned, unless overridden - with these moves.
export function makeFinishedGame(
  sans: string[],
  overrides: Partial<GameSnapshot> = {},
): GameSnapshot {
  const moves = movesFromSan(sans);
  return makeGameSnapshot({
    status: 'completed',
    result: 'black',
    resultReason: 'resignation',
    moves,
    fen: moves[moves.length - 1]?.fenAfter ?? STARTING_FEN,
    endedAt: '2026-01-01T00:10:00.000Z',
    ...overrides,
  });
}

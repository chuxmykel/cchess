import { GameSnapshot } from '../network/socketEvents';

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
    createdAt: '2026-01-01T00:00:00.000Z',
    endedAt: null,
    chatClosesAt: null,
    ...overrides,
  };
}

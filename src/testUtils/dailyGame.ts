import { DailyGame } from '../network/restClient';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** A daily game in progress, as GET /games/daily lists it: yours to move,
 * as white, with three days left. */
export function makeDailyGame(overrides: Partial<DailyGame> = {}): DailyGame {
  return {
    id: 'daily-1',
    fen: START,
    turn: 'w',
    lastMove: null,
    playedAsWhite: true,
    myTurn: true,
    daysPerMove: 3,
    moveDeadlineAt: '2026-01-04T00:00:00.000Z',
    rated: true,
    opponent: {
      id: 'opponent-1',
      username: 'judit',
      displayName: 'Judit',
      avatarColor: '#E8601C',
    },
    ...overrides,
  };
}

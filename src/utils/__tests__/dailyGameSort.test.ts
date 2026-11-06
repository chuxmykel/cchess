import { lastMovedAt, sortDailyGames } from '../dailyGameSort';
import { makeDailyGame } from '../../testUtils/dailyGame';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-01-10T00:00:00.000Z');
const at = (ms: number) => new Date(NOW + ms).toISOString();

// Theirs: 2 hours left on a 1-day game - moved 22 hours ago.
const THEIRS_SOON = makeDailyGame({
  id: 'theirs-soon',
  myTurn: false,
  daysPerMove: 1,
  moveDeadlineAt: at(2 * HOUR),
  opponent: { ...makeDailyGame().opponent, displayName: 'Zoe' },
});
// Yours: 30 hours left on a 3-day game - moved 42 hours ago.
const MINE_LATER = makeDailyGame({
  id: 'mine-later',
  myTurn: true,
  daysPerMove: 3,
  moveDeadlineAt: at(30 * HOUR),
  opponent: { ...makeDailyGame().opponent, displayName: 'anna' },
});
// Yours: 6 hours left on a 1-day game - moved 18 hours ago.
const MINE_SOON = makeDailyGame({
  id: 'mine-soon',
  myTurn: true,
  daysPerMove: 1,
  moveDeadlineAt: at(6 * HOUR),
  opponent: { ...makeDailyGame().opponent, displayName: 'Bob' },
});
const GAMES = [THEIRS_SOON, MINE_LATER, MINE_SOON];
const ids = (games: { id: string }[]) => games.map((game) => game.id);

describe('dailyGameSort', () => {
  it('tells when a game last moved, from its deadline and days', () => {
    expect(lastMovedAt(THEIRS_SOON)).toBe(NOW - 22 * HOUR);
  });

  it('puts your move first, each by time left', () => {
    expect(ids(sortDailyGames(GAMES, 'yourMove'))).toEqual([
      'mine-soon',
      'mine-later',
      'theirs-soon',
    ]);
  });

  it('sorts by time left, the last move, or the opponent', () => {
    expect(ids(sortDailyGames(GAMES, 'timeLeft'))).toEqual([
      'theirs-soon',
      'mine-soon',
      'mine-later',
    ]);
    expect(ids(sortDailyGames(GAMES, 'lastMove'))).toEqual([
      'mine-soon',
      'theirs-soon',
      'mine-later',
    ]);
    expect(ids(sortDailyGames(GAMES, 'opponent'))).toEqual([
      'mine-later',
      'mine-soon',
      'theirs-soon',
    ]);
  });

  it('keeps only those on your move, when asked', () => {
    expect(ids(sortDailyGames(GAMES, 'timeLeft', true))).toEqual([
      'mine-soon',
      'mine-later',
    ]);
  });

  it('leaves the games it was given as they were', () => {
    const games = [...GAMES];
    sortDailyGames(games, 'opponent');
    expect(games).toEqual(GAMES);
  });
});

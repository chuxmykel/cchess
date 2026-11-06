import { DailyGame } from '../network/restClient';

const DAY_MS = 24 * 60 * 60 * 1000;

export type DailyGameSort = 'yourMove' | 'timeLeft' | 'lastMove' | 'opponent';

export const DAILY_GAME_SORTS: { key: DailyGameSort; label: string }[] = [
  { key: 'yourMove', label: 'Your move first' },
  { key: 'timeLeft', label: 'Time left' },
  { key: 'lastMove', label: 'Last move' },
  { key: 'opponent', label: 'Opponent (A–Z)' },
];

function deadlineOf(game: DailyGame): number {
  return new Date(game.moveDeadlineAt).getTime();
}

/** When the game last moved - its deadline, less the days a move gives,
 * since each move sets the deadline that far ahead. (For a game with no
 * moves yet, when it started.) */
export function lastMovedAt(game: DailyGame): number {
  return deadlineOf(game) - game.daysPerMove * DAY_MS;
}

const byTimeLeft = (a: DailyGame, b: DailyGame) =>
  deadlineOf(a) - deadlineOf(b);

const COMPARATORS: Record<
  DailyGameSort,
  (a: DailyGame, b: DailyGame) => number
> = {
  // As the server lists them: those on your move first, each by time left.
  yourMove: (a, b) => Number(b.myTurn) - Number(a.myTurn) || byTimeLeft(a, b),
  timeLeft: byTimeLeft,
  // The most recently moved first.
  lastMove: (a, b) => lastMovedAt(b) - lastMovedAt(a),
  opponent: (a, b) =>
    a.opponent.displayName.localeCompare(b.opponent.displayName, undefined, {
      sensitivity: 'base',
    }) || byTimeLeft(a, b),
};

/** A copy of the games in the given order - only those on your move, with
 * `yourMoveOnly`. */
export function sortDailyGames(
  games: DailyGame[],
  sort: DailyGameSort,
  yourMoveOnly = false,
): DailyGame[] {
  return games
    .filter((game) => !yourMoveOnly || game.myTurn)
    .sort(COMPARATORS[sort]);
}

import type { PuzzleStats } from '../network/restClient';

export function makePuzzleStats(
  overrides: Partial<PuzzleStats> = {},
): PuzzleStats {
  return {
    period: '1m',
    rating: { rating: 1588, attempts: 12, provisional: false },
    history: [
      { at: '2026-11-01T10:00:00.000Z', rating: 1500 },
      { at: '2026-11-20T10:00:00.000Z', rating: 1588 },
    ],
    highest: { at: '2026-11-20T10:00:00.000Z', rating: 1588 },
    lowest: { at: '2026-11-01T10:00:00.000Z', rating: 1500 },
    ratingChange: 88,
    attempts: 12,
    solved: 9,
    missed: 3,
    bestSolve: { puzzleId: 'p1', rating: 1840, at: '2026-11-20T10:00:00.000Z' },
    longestSolvedStreak: 6,
    longestMissedStreak: 2,
    themes: [
      { theme: 'fork', attempts: 6, solved: 6 },
      { theme: 'middlegame', attempts: 6, solved: 4 },
      { theme: 'pin', attempts: 4, solved: 1 },
    ],
    ...overrides,
  };
}

import { RatingStats } from '../network/restClient';

export function makeRatingStats(
  overrides: Partial<RatingStats> = {},
): RatingStats {
  return {
    period: '1m',
    rating: {
      category: 'blitz',
      rating: 1662,
      gamesPlayed: 40,
      provisional: false,
    },
    history: [
      { at: '2026-10-01T10:00:00.000Z', rating: 1650 },
      { at: '2026-10-01T10:10:00.000Z', rating: 1641 },
      { at: '2026-10-20T18:00:00.000Z', rating: 1670 },
      { at: '2026-10-26T18:00:00.000Z', rating: 1662 },
    ],
    highest: { at: '2026-10-20T18:00:00.000Z', rating: 1670 },
    lowest: { at: '2026-10-01T10:10:00.000Z', rating: 1641 },
    ratingChange: 12,
    games: 12,
    wins: 6,
    draws: 2,
    losses: 4,
    timePlayedMs: 2 * 60 * 60 * 1000,
    bestWin: {
      gameId: 'game-best',
      opponentUsername: 'magnus',
      opponentDisplayName: 'Magnus',
      opponentRating: 1820,
      endedAt: '2026-10-20T18:00:00.000Z',
    },
    worstLoss: {
      gameId: 'game-worst',
      opponentUsername: 'newbie',
      opponentDisplayName: 'Newbie',
      opponentRating: 1410,
      endedAt: '2026-10-01T10:10:00.000Z',
    },
    longestWinStreak: 4,
    longestLosingStreak: 2,
    ...overrides,
  };
}

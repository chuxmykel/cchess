import type { Badge } from '../domain/badges';

/** A badge awarded, in a game won against Magnus, unless given. */
export function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: 'badge-1',
    kind: 'comeback',
    game: {
      gameId: 'game-1',
      opponentUsername: 'magnus',
      opponentDisplayName: 'Magnus',
      result: 'win',
      endedAt: '2026-11-05T10:00:00.000Z',
    },
    category: null,
    value: null,
    awardedAt: '2026-11-05T10:00:00.000Z',
    ...overrides,
  };
}

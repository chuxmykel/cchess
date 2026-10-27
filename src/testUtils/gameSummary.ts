import { GameSummary } from '../network/restClient';

export function makeGameSummary(
  overrides: Partial<GameSummary> = {},
): GameSummary {
  return {
    id: 'game-1',
    gameType: 'blitz',
    minutes: 5,
    incrementSeconds: 0,
    rated: false,
    status: 'completed',
    result: 'win',
    opponentUsername: 'judit',
    opponentDisplayName: 'Judit Polgar',
    playedAsWhite: true,
    createdAt: '2026-10-26T10:00:00.000Z',
    endedAt: '2026-10-26T10:08:00.000Z',
    ...overrides,
  };
}

import { countMatching } from '../gameCounts';
import { GameCount } from '../../network/restClient';

const COUNTS: GameCount[] = [
  { result: 'win', gameType: 'blitz', count: 5 },
  { result: 'loss', gameType: 'blitz', count: 3 },
  { result: 'win', gameType: 'rapid', count: 2 },
  { result: 'draw', gameType: 'daily', count: 1 },
];

describe('countMatching', () => {
  it.each([
    [{}, 11],
    [{ result: 'win' as const }, 7],
    [{ gameType: 'blitz' as const }, 8],
    [{ result: 'win' as const, gameType: 'rapid' as const }, 2],
    [{ result: 'draw' as const, gameType: 'blitz' as const }, 0],
  ])('counts the games matching %j', (filter, expected) => {
    expect(countMatching(COUNTS, filter)).toBe(expected);
  });
});

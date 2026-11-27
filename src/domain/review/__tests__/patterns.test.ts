import type { SideDigest } from '../digest';
import { type DigestedGame, patternsOf } from '../patterns';

const digest = (overrides: Partial<SideDigest> = {}): SideDigest => ({
  v: 1,
  accuracy: 80,
  result: 'win',
  opening: null,
  moves: 30,
  missedTactics: 0,
  slips: [],
  accuracyByClock: null,
  accuracyByPhase: { opening: 90, middlegame: 80, endgame: null },
  marks: { '!!': 0, '!': 1, '?!': 2, '?': 1, '??': 0 },
  chances: { high: 60, low: 40 },
  ...overrides,
});
const game = (
  d: SideDigest,
  color: 'w' | 'b' = 'w',
  endedAt: string | null = null,
): DigestedGame => ({
  gameId: `g-${endedAt}`,
  color,
  endedAt,
  digest: d,
});
const slip = (
  facts: SideDigest['slips'][number]['facts'],
  phase: SideDigest['slips'][number]['phase'],
) => ({ ply: 10, mark: '?' as const, facts, phase, clockShare: null });

describe('patternsOf', () => {
  it('counts slips and pieces left hanging by phase', () => {
    const patterns = patternsOf([
      game(
        digest({ slips: [slip(['hangs'], 'opening'), slip([], 'endgame')] }),
      ),
      game(digest({ slips: [slip(['hangs'], 'opening')] })),
    ]);

    expect(patterns.games).toBe(2);
    expect(patterns.slipsByPhase).toEqual({
      opening: 2,
      middlegame: 0,
      endgame: 1,
    });
    expect(patterns.hangingByPhase).toEqual({
      opening: 2,
      middlegame: 0,
      endgame: 0,
    });
  });

  it('puts the theme slipped on most first', () => {
    const patterns = patternsOf([
      game(
        digest({
          slips: [
            slip(['hangs'], 'middlegame'),
            slip(['hangs'], 'middlegame'),
            slip(['allowsFork'], 'middlegame'),
          ],
        }),
      ),
    ]);

    expect(patterns.weakThemes[0]).toEqual({ theme: 'hangingPiece', count: 2 });
  });

  it('averages accuracy, on the clock and overall, and keeps openings results', () => {
    const patterns = patternsOf([
      game(
        digest({
          accuracy: 90,
          opening: 'Italian Game',
          result: 'win',
          accuracyByClock: { plenty: 92, short: 70 },
        }),
      ),
      game(
        digest({
          accuracy: 70,
          opening: 'Italian Game',
          result: 'draw',
          accuracyByClock: { plenty: 80, short: 60 },
        }),
      ),
      game(digest({ accuracy: 80, opening: 'French Defense', result: 'loss' })),
    ]);

    expect(patterns.accuracy).toBe(80);
    expect(patterns.accuracyByClock).toEqual({ plenty: 86, short: 65 });
    expect(patterns.openings[0]).toMatchObject({
      name: 'Italian Game',
      games: 2,
      wins: 1,
      draws: 1,
      losses: 0,
    });
  });

  it('has no clock reading without clocked games', () => {
    expect(patternsOf([game(digest())]).accuracyByClock).toBeNull();
  });

  it('averages accuracy by phase and the marks a game, keeping each game in order', () => {
    const patterns = patternsOf([
      game(digest({ accuracy: 70 }), 'w', '2026-11-02'),
      game(
        digest({
          accuracy: 90,
          accuracyByPhase: { opening: 70, middlegame: null, endgame: 60 },
          marks: { '!!': 2, '!': 1, '?!': 0, '?': 1, '??': 2 },
        }),
        'w',
        '2026-11-01',
      ),
    ]);

    expect(patterns.accuracyTrend.map((g) => g.accuracy)).toEqual([90, 70]);
    expect(patterns.accuracyByPhase).toEqual({
      opening: 80,
      middlegame: 80,
      endgame: 60,
    });
    expect(patterns.marksPerGame).toEqual({
      '!!': 1,
      '!': 1,
      '?!': 1,
      '?': 1,
      '??': 1,
    });
  });

  it('counts the winning positions won and the losing ones saved', () => {
    const patterns = patternsOf([
      game(digest({ chances: { high: 80, low: 50 }, result: 'win' })),
      game(digest({ chances: { high: 70, low: 50 }, result: 'draw' })),
      game(digest({ chances: { high: 50, low: 20 }, result: 'draw' })),
      game(digest({ chances: { high: 50, low: 10 }, result: 'loss' })),
    ]);

    expect(patterns.converting).toEqual({ chances: 2, won: 1 });
    expect(patterns.saving).toEqual({ chances: 2, saved: 1 });
  });

  it('keeps results and openings by color, and slips in time trouble', () => {
    const patterns = patternsOf([
      game(digest({ opening: 'Italian Game', result: 'win' }), 'w'),
      game(digest({ opening: 'Italian Game', result: 'loss' }), 'b'),
      game(
        digest({
          slips: [{ ...slip([], 'middlegame'), clockShare: 0.1 }],
          result: 'draw',
        }),
        'b',
      ),
    ]);

    expect(patterns.results).toEqual({
      w: { games: 1, wins: 1, draws: 0, losses: 0 },
      b: { games: 2, wins: 0, draws: 1, losses: 1 },
    });
    expect(patterns.openings.map((o) => [o.name, o.color])).toEqual([
      ['Italian Game', 'w'],
      ['Italian Game', 'b'],
    ]);
    expect(patterns.timeTroubleSlips).toBe(1);
  });
});

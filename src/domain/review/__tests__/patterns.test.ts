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
  badges: [],
  ...overrides,
});
const game = (d: SideDigest): DigestedGame => ({
  gameId: 'g',
  color: 'w',
  endedAt: null,
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
    expect(patterns.openings[0]).toEqual({
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
});

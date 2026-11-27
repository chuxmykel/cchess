import { THEME_STRENGTH_MIN_ATTEMPTS, themeStrengths } from '../themes';

const tried = (theme: string, solved: number, attempts = 5) => ({
  theme,
  attempts,
  solved,
});

describe('themeStrengths', () => {
  it('puts the themes solved most often first, those solved least among the weakest', () => {
    const { strongest, weakest } = themeStrengths([
      tried('fork', 5),
      tried('pin', 1),
      tried('skewer', 4),
      tried('mateIn1', 2),
    ]);

    expect(strongest.map((t) => t.theme)).toEqual(['fork', 'skewer']);
    expect(strongest[0].rate).toBe(1);
    expect(weakest.map((t) => t.theme)).toEqual(['pin', 'mateIn1']);
  });

  it("leaves out themes the app doesn't offer, and those barely tried", () => {
    const { strongest, weakest } = themeStrengths([
      tried('middlegame', 5),
      tried('fork', 3, THEME_STRENGTH_MIN_ATTEMPTS - 1),
      tried('pin', 2),
    ]);

    expect(strongest.map((t) => t.theme)).toEqual(['pin']);
    expect(weakest).toEqual([]);
  });

  it('breaks a tie by the more tried', () => {
    const { strongest, weakest } = themeStrengths([
      tried('fork', 3, 4),
      tried('pin', 6, 8),
    ]);

    expect(strongest.map((t) => t.theme)).toEqual(['pin']);
    expect(weakest.map((t) => t.theme)).toEqual(['fork']);
  });
});

import { analysisArrows } from '../analysisArrows';
import { EngineLineView } from '../../hooks/useEngineAnalysis';
import { lightTheme } from '../../theme/themes';

const BOARD = lightTheme.colors.board;

function line(...pv: string[]): EngineLineView {
  return {
    score: { kind: 'cp', cp: 0 },
    formatted: '0.0',
    sans: [],
    moves: [],
    pv,
  };
}

describe('analysisArrows', () => {
  it("draws each line's first move, the best one boldest", () => {
    const arrows = analysisArrows(
      [line('e2e4', 'e7e5'), line('d2d4')],
      undefined,
      BOARD,
    );

    expect(arrows.map(({ from, to }) => `${from}${to}`)).toEqual([
      'e2e4',
      'd2d4',
    ]);
    expect(arrows[0].weight).toBeGreaterThan(arrows[1].weight);
  });

  it('adds the threat, in its own colour', () => {
    const arrows = analysisArrows([line('e2e4')], line('d8h4'), BOARD);

    expect(arrows[1]).toMatchObject({ from: 'd8', to: 'h4' });
    expect(arrows[1].color).not.toBe(arrows[0].color);
  });

  it('draws nothing without lines', () => {
    expect(analysisArrows([], undefined, BOARD)).toEqual([]);
    expect(analysisArrows([line()], line(), BOARD)).toEqual([]);
  });
});

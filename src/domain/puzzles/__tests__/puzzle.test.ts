import { fromMine, fromPool, isRight, solverColor, startOf } from '../puzzle';

// Black plays a7a6, then Rd1-d8 mates.
const POOL = {
  id: 'p1',
  fen: '6k1/p4ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
  moves: ['a7a6', 'd1d8'],
  rating: 1500,
  themes: ['mateIn1'],
};

describe('puzzle', () => {
  it("sets a lichess puzzle up with the opponent's move, the solver to play next", () => {
    const puzzle = fromPool(POOL);

    expect(puzzle).toMatchObject({ setup: 'a7a6', solution: ['d1d8'] });
    expect(startOf(puzzle)).toBe('6k1/5ppp/p7/8/8/8/5PPP/3R2K1 w - - 0 2');
    expect(solverColor(puzzle)).toBe('w');
  });

  it('starts one of your own from its position, you to move', () => {
    const puzzle = fromMine({
      id: 'm1',
      fen: '6k1/5ppp/p7/8/8/8/5PPP/3R2K1 w - - 0 2',
      solution: ['d1d8'],
      themes: [],
    });

    expect(puzzle.setup).toBeNull();
    expect(startOf(puzzle)).toBe(puzzle.fen);
  });

  it('takes the solution move, or any mate where the solution mates', () => {
    const puzzle = fromPool(POOL);
    const fen = startOf(puzzle);

    expect(isRight(puzzle, fen, 0, 'd1d8')).toBe(true);
    expect(isRight(puzzle, fen, 0, 'd1d7')).toBe(false);
  });
});

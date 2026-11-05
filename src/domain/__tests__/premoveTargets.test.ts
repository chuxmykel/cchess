import { isPromotionPremove, premoveTargets } from '../premoveTargets';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('premoveTargets', () => {
  it("gives only that side's pieces", () => {
    const targets = premoveTargets(START, 'b');
    expect(Object.keys(targets)).toHaveLength(16);
    expect(targets.e2).toBeUndefined();
    expect(targets.e7).toBeDefined();
  });

  it("gives a pawn its pushes and both captures, whether there's a piece to take or not", () => {
    const targets = premoveTargets(START, 'w');
    expect(targets.e2?.sort()).toEqual(['d3', 'e3', 'e4', 'f3']);
    expect(targets.a2?.sort()).toEqual(['a3', 'a4', 'b3']);
  });

  it("gives a black pawn's the other way, and only one push off its start", () => {
    const fen = '4k3/8/8/4p3/8/8/8/4K3 b - - 0 1';
    expect(premoveTargets(fen, 'b').e5?.sort()).toEqual(['d4', 'e4', 'f4']);
  });

  it('runs a slider to the edge of the board, through pieces in the way', () => {
    const targets = premoveTargets(START, 'w');
    expect(targets.a1).toEqual(
      expect.arrayContaining(['a2', 'a8', 'b1', 'h1']),
    );
    expect(targets.a1).toHaveLength(14);
    expect(targets.d1).toHaveLength(21);
  });

  it('gives a knight its jumps on the board', () => {
    expect(premoveTargets(START, 'w').g1?.sort()).toEqual(['e2', 'f3', 'h3']);
  });

  it('offers castling only while the FEN still allows it', () => {
    expect(premoveTargets(START, 'w').e1).toEqual(
      expect.arrayContaining(['c1', 'g1']),
    );
    const kingsideOnly =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Kkq - 0 1';
    const e1 = premoveTargets(kingsideOnly, 'w').e1;
    expect(e1).toContain('g1');
    expect(e1).not.toContain('c1');
  });
});

describe('isPromotionPremove', () => {
  const fen = '4k3/P7/8/8/8/8/p7/4K3 w - - 0 1';

  it("is a pawn going to its last rank, either side's", () => {
    expect(isPromotionPremove(fen, 'a7', 'a8')).toBe(true);
    expect(isPromotionPremove(fen, 'a2', 'a1')).toBe(true);
  });

  it('is nothing else', () => {
    expect(isPromotionPremove(fen, 'e1', 'e2')).toBe(false);
    expect(isPromotionPremove(START, 'e2', 'e4')).toBe(false);
  });
});

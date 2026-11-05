import { parsePlacement } from '../fen';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('parsePlacement', () => {
  it('lists every piece standing in the position', () => {
    const pieces = parsePlacement('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1');

    expect(pieces).toEqual([
      { square: 'e8', type: 'k', color: 'b' },
      { square: 'e4', type: 'p', color: 'w' },
      { square: 'e1', type: 'k', color: 'w' },
    ]);
  });

  it('lists all 32 pieces at the start', () => {
    expect(parsePlacement(START)).toHaveLength(32);
  });

  it('reads a placement on its own, without the rest of a FEN', () => {
    expect(parsePlacement('8/8/8/8/8/8/8/R7')).toEqual([
      { square: 'a1', type: 'r', color: 'w' },
    ]);
  });

  it("draws a placement chess wouldn't allow - no kings, a pawn on the back rank", () => {
    expect(parsePlacement('P7/8/8/8/8/8/8/8 w - - 0 1')).toEqual([
      { square: 'a8', type: 'p', color: 'w' },
    ]);
  });

  it('leaves off what it cannot read', () => {
    expect(parsePlacement('x3k3/8/8/8/8/8/8/9 w - - 0 1')).toEqual([
      { square: 'e8', type: 'k', color: 'b' },
    ]);
  });

  it('draws nothing for an empty board', () => {
    expect(parsePlacement('8/8/8/8/8/8/8/8')).toEqual([]);
  });
});

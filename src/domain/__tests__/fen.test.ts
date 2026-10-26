import { DEFAULT_POSITION } from 'chess.js';

import { piecesFromFen, plyCountFromFen } from '../fen';

describe('plyCountFromFen', () => {
  it('counts no moves at the starting position', () => {
    expect(plyCountFromFen(DEFAULT_POSITION)).toBe(0);
  });

  it("counts white's first move", () => {
    expect(
      plyCountFromFen(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      ),
    ).toBe(1);
  });

  it('counts both sides once black has replied', () => {
    expect(
      plyCountFromFen(
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      ),
    ).toBe(2);
  });
});

describe('piecesFromFen', () => {
  it('lists every piece standing in the position', () => {
    const pieces = piecesFromFen('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1');

    expect(pieces).toHaveLength(3);
    expect(pieces).toEqual(
      expect.arrayContaining([
        { square: 'e8', type: 'k', color: 'b' },
        { square: 'e4', type: 'p', color: 'w' },
        { square: 'e1', type: 'k', color: 'w' },
      ]),
    );
  });

  it('lists all 32 pieces at the start', () => {
    expect(piecesFromFen(DEFAULT_POSITION)).toHaveLength(32);
  });
});

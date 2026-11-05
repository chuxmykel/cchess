import { DEFAULT_POSITION } from 'chess.js';

import { plyCountFromFen } from '../fen';

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

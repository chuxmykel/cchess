import { nullMoveFen } from '../threat';

describe('nullMoveFen', () => {
  it('passes the move to the other side, with no en passant', () => {
    expect(
      nullMoveFen(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      ),
    ).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2');
  });

  it("keeps the move number when it's white passing", () => {
    expect(
      nullMoveFen('4k3/8/8/8/8/8/8/4K3 w - - 0 7')?.split(' ').slice(1),
    ).toEqual(['b', '-', '-', '1', '7']);
  });

  it('is null in check, where passing is not possible', () => {
    // 1. e4 f6 2. Qh5+
    expect(
      nullMoveFen(
        'rnbqkbnr/ppppp1pp/5p2/7Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',
      ),
    ).toBeNull();
  });
});

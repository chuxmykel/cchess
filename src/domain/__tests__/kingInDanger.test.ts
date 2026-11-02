import { kingInDanger } from '../kingInDanger';

describe('kingInDanger', () => {
  const QUIET = '4k3/8/8/8/4P3/8/8/4K3 b - - 0 1';
  // 1. e4 f6 2. Qh5+
  const CHECK = 'rnbqkbnr/ppppp1pp/5p2/7Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2';
  // Fool's mate.
  const MATE = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';

  it('is null with no king in check and no side beaten', () => {
    expect(kingInDanger(QUIET)).toBeNull();
  });

  it("marks the side to move's king in check, standing", () => {
    expect(kingInDanger(CHECK)).toEqual({ square: 'e8', fallen: false });
  });

  it('fells a mated king', () => {
    expect(kingInDanger(MATE)).toEqual({ square: 'e1', fallen: true });
  });

  it("fells the beaten side's king however it lost - on time, resigning", () => {
    expect(kingInDanger(QUIET, 'w')).toEqual({ square: 'e1', fallen: true });
    // Even when the other king is the one in check.
    expect(kingInDanger(CHECK, 'w')).toEqual({ square: 'e1', fallen: true });
  });
});

import { materialImbalance } from '../material';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('materialImbalance', () => {
  it('shows nothing when material is level', () => {
    expect(materialImbalance(START)).toEqual({
      w: { pieces: [], score: 0 },
      b: { pieces: [], score: 0 },
    });
  });

  it('credits the side that captured with the piece and its value', () => {
    // White has taken a knight.
    const fen = 'r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';

    expect(materialImbalance(fen)).toEqual({
      w: { pieces: ['n'], score: 3 },
      b: { pieces: [], score: 0 },
    });
  });

  it('nets out trades, showing each side what it is up, most valuable first', () => {
    // White is up a rook, black is up two pawns: white leads by 3.
    const fen = '1nbqkbnr/pppppppp/8/8/8/8/2PPPPPP/RNBQKBNR w KQk - 0 1';

    expect(materialImbalance(fen)).toEqual({
      w: { pieces: ['r'], score: 3 },
      b: { pieces: ['p', 'p'], score: 0 },
    });
  });

  it('counts a promoted piece as the piece it became', () => {
    // White promoted a pawn to a second queen; black still has all eight pawns.
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP1/RNBQKBNQ w Qkq - 0 1';

    expect(materialImbalance(fen)).toEqual({
      w: { pieces: ['q'], score: 3 },
      b: { pieces: ['r', 'p'], score: 0 },
    });
  });
});

import { capturedMaterial, materialImbalance } from '../material';

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

describe('capturedMaterial', () => {
  it('shows every piece each side has taken, not just the difference', () => {
    // White took a knight and a pawn; black took a knight. Level material
    // but a pawn, so white leads by 1.
    const fen = 'r1bqkbnr/ppp1pppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1';
    const moves = [
      { color: 'w' as const, captured: 'p' as const },
      { color: 'b' as const, captured: 'n' as const },
      { color: 'w' as const, captured: null },
      { color: 'w' as const, captured: 'n' as const },
    ];

    expect(capturedMaterial(fen, moves)).toEqual({
      w: { pieces: ['p', 'n'], score: 1 },
      b: { pieces: ['n'], score: 0 },
    });
  });

  it('puts the score on whoever is ahead, promotions included', () => {
    // Black took a rook, but white promoted a pawn to a queen: white is
    // ahead (9 - 1 for the pawn, less the rook) though it took nothing.
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/QNBQKBNR w Kkq - 0 1';
    const moves = [{ color: 'b' as const, captured: 'r' as const }];

    expect(capturedMaterial(fen, moves)).toEqual({
      w: { pieces: [], score: 3 },
      b: { pieces: ['r'], score: 0 },
    });
  });

  it('lists them least valuable first', () => {
    const moves = (['q', 'p', 'r', 'n', 'p', 'b'] as const).map((captured) => ({
      color: 'w' as const,
      captured,
    }));

    expect(capturedMaterial(START, moves).w.pieces).toEqual([
      'p',
      'p',
      'n',
      'b',
      'r',
      'q',
    ]);
  });

  it('shows nothing before any capture', () => {
    expect(capturedMaterial(START, [])).toEqual({
      w: { pieces: [], score: 0 },
      b: { pieces: [], score: 0 },
    });
  });
});

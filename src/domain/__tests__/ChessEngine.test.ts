import { ChessEngine } from '../ChessEngine';

describe('ChessEngine', () => {
  it('starts with the standard 32-piece setup and white to move', () => {
    const engine = new ChessEngine();

    expect(engine.getBoardSnapshot()).toHaveLength(32);
    expect(engine.getTurn()).toBe('w');
    expect(engine.isGameOver()).toBe(false);
  });

  it('accepts a starting FEN', () => {
    const engine = new ChessEngine('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');

    expect(engine.getBoardSnapshot()).toHaveLength(3);
    expect(engine.getTurn()).toBe('w');
  });

  it('reports legal destination squares for a piece', () => {
    const engine = new ChessEngine();

    const squares = engine.getLegalMoveSquares('e2');

    expect(squares.sort()).toEqual(['e3', 'e4']);
  });

  it('rejects an illegal move without mutating the board', () => {
    const engine = new ChessEngine();

    const result = engine.attemptMove('e2', 'e5');

    expect(result).toEqual({ status: 'illegal' });
    expect(engine.getTurn()).toBe('w');
  });

  it('applies a legal move and switches turn', () => {
    const engine = new ChessEngine();

    const result = engine.attemptMove('e2', 'e4');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move).toMatchObject({
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      isCapture: false,
    });
    expect(engine.getTurn()).toBe('b');
  });

  it('classifies a capture and names the captured square', () => {
    const engine = new ChessEngine('4k3/8/8/8/8/2b5/8/1N2K3 w - - 0 1');

    const result = engine.attemptMove('b1', 'c3');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isCapture).toBe(true);
    expect(result.move.capturedSquare).toBe('c3');
  });

  it('does not flag an ordinary move to an empty square as a capture', () => {
    const engine = new ChessEngine('4k3/8/8/8/8/2b5/8/1N2K3 w - - 0 1');

    const result = engine.attemptMove('b1', 'd2');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isCapture).toBe(false);
    expect(result.move.capturedSquare).toBeUndefined();
  });

  it("classifies kingside castling and the rook's from/to squares", () => {
    const engine = new ChessEngine(
      'r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5',
    );

    const result = engine.attemptMove('e1', 'g1');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isKingSideCastle).toBe(true);
    expect(result.move.rookFrom).toBe('h1');
    expect(result.move.rookTo).toBe('f1');
  });

  it("classifies queenside castling and the rook's from/to squares", () => {
    const engine = new ChessEngine(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1',
    );

    const result = engine.attemptMove('e1', 'c1');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isQueenSideCastle).toBe(true);
    expect(result.move.rookFrom).toBe('a1');
    expect(result.move.rookTo).toBe('d1');
  });

  it('classifies black castling the same way', () => {
    const engine = new ChessEngine(
      'r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 6 5',
    );

    const result = engine.attemptMove('e8', 'g8');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isKingSideCastle).toBe(true);
    expect(result.move.rookFrom).toBe('h8');
    expect(result.move.rookTo).toBe('f8');
  });

  it("finds the en passant captured square on the capturing pawn's own rank, regardless of color", () => {
    const whiteEnPassant = new ChessEngine();
    whiteEnPassant.attemptMove('e2', 'e4');
    whiteEnPassant.attemptMove('a7', 'a6');
    whiteEnPassant.attemptMove('e4', 'e5');
    whiteEnPassant.attemptMove('d7', 'd5');

    const whiteResult = whiteEnPassant.attemptMove('e5', 'd6');
    expect(whiteResult.status).toBe('ok');
    if (whiteResult.status !== 'ok') return;
    expect(whiteResult.move.isEnPassant).toBe(true);
    expect(whiteResult.move.capturedSquare).toBe('d5');

    const blackEnPassant = new ChessEngine();
    blackEnPassant.attemptMove('a2', 'a3');
    blackEnPassant.attemptMove('e7', 'e5');
    blackEnPassant.attemptMove('a3', 'a4');
    blackEnPassant.attemptMove('e5', 'e4');
    blackEnPassant.attemptMove('d2', 'd4');

    const blackResult = blackEnPassant.attemptMove('e4', 'd3');
    expect(blackResult.status).toBe('ok');
    if (blackResult.status !== 'ok') return;
    expect(blackResult.move.isEnPassant).toBe(true);
    expect(blackResult.move.capturedSquare).toBe('d4');
  });

  it('asks for a promotion choice instead of applying the move when none is given', () => {
    const engine = new ChessEngine('8/4P3/8/2k5/8/4K3/8/8 w - - 0 1');

    const result = engine.attemptMove('e7', 'e8');

    expect(result).toEqual({
      status: 'needs-promotion-choice',
      from: 'e7',
      to: 'e8',
    });
    expect(
      engine.getBoardSnapshot().find((piece) => piece.square === 'e7'),
    ).toBeDefined();
  });

  it('applies the move once a promotion piece is supplied', () => {
    const engine = new ChessEngine('8/4P3/8/2k5/8/4K3/8/8 w - - 0 1');

    const result = engine.attemptMove('e7', 'e8', 'q');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isPromotion).toBe(true);
    expect(result.move.promotionPiece).toBe('q');
    expect(engine.getBoardSnapshot()).toEqual(
      expect.arrayContaining([{ square: 'e8', type: 'q', color: 'w' }]),
    );
  });

  it('supports promotion via a capturing move onto a different file than the pawn departed from', () => {
    const engine = new ChessEngine('4kn2/4P3/8/8/8/8/8/4K3 w - - 0 1');

    const result = engine.attemptMove('e7', 'f8', 'q');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.move.isCapture).toBe(true);
    expect(result.move.capturedSquare).toBe('f8');
    expect(engine.getBoardSnapshot()).toEqual(
      expect.arrayContaining([{ square: 'f8', type: 'q', color: 'w' }]),
    );
  });

  it('reports check, checkmate and game-over status', () => {
    const engine = new ChessEngine();
    engine.attemptMove('f2', 'f3');
    engine.attemptMove('e7', 'e5');
    engine.attemptMove('g2', 'g4');

    expect(engine.isCheckmate()).toBe(false);
    expect(engine.isGameOver()).toBe(false);

    const result = engine.attemptMove('d8', 'h4');

    expect(result.status).toBe('ok');
    expect(engine.isCheck()).toBe(true);
    expect(engine.isCheckmate()).toBe(true);
    expect(engine.isGameOver()).toBe(true);
  });
});

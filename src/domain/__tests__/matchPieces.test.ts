import { IdentifiedPiece, matchPieces } from '../matchPieces';
import { piecesFromFen } from '../fen';

// Every piece of a position, each given its square as its id.
function identified(fen: string): IdentifiedPiece[] {
  return piecesFromFen(fen).map((piece) => ({ ...piece, id: piece.square }));
}

// Which square's piece (by id) ended up on each square.
function cameFrom(previousFen: string, nextFen: string) {
  let fresh = 0;
  const matched = matchPieces(
    identified(previousFen),
    piecesFromFen(nextFen),
    () => `new-${fresh++}`,
  );
  return Object.fromEntries(matched.map((piece) => [piece.square, piece.id]));
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('matchPieces', () => {
  it('keeps every piece that stayed on its square', () => {
    const result = cameFrom(START, START);

    expect(result.e1).toBe('e1');
    expect(result.a8).toBe('a8');
    expect(Object.keys(result)).toHaveLength(32);
  });

  it('moves the piece that moved', () => {
    const result = cameFrom(
      START,
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    );

    expect(result.e4).toBe('e2');
    expect(result.d2).toBe('d2');
  });

  it('moves the piece that took, and drops the one taken', () => {
    const result = cameFrom(
      '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
      '4k3/8/8/3P4/8/8/8/4K3 b - - 0 1',
    );

    expect(result.d5).toBe('e4');
    expect(Object.values(result)).not.toContain('d5');
  });

  it('brings a taken piece back as new, stepping back', () => {
    const result = cameFrom(
      '4k3/8/8/3P4/8/8/8/4K3 b - - 0 1',
      '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
    );

    expect(result.e4).toBe('d5');
    expect(result.d5).toBe('new-0');
  });

  it('moves both king and rook in a castle', () => {
    const result = cameFrom(
      'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      'r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1',
    );

    expect(result.g1).toBe('e1');
    expect(result.f1).toBe('h1');
    expect(result.a1).toBe('a1');
  });

  it('turns the pawn that promoted into the piece it became', () => {
    const result = cameFrom(
      '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
      'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1',
    );

    expect(result.a8).toBe('a7');
  });

  it('pairs pieces of a kind nearest first, several moves on', () => {
    const result = cameFrom(
      START,
      'rnbqkbnr/pppppppp/8/8/8/2N2N2/PPPPPPPP/R1BQKB1R w KQkq - 0 1',
    );

    expect(result.c3).toBe('b1');
    expect(result.f3).toBe('g1');
  });
});

import { Chess, DEFAULT_POSITION } from 'chess.js';

import { bookMovesFrom, epd, openingAt } from '../openings';

// Every position along a line of SAN moves, the start first.
function fensAlong(...sans: string[]) {
  const chess = new Chess();
  return [
    DEFAULT_POSITION,
    ...sans.map((san) => (chess.move(san), chess.fen())),
  ];
}

describe('openings', () => {
  it('keys a position without its move counters', () => {
    expect(epd(DEFAULT_POSITION)).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
    );
  });

  it('has no name for the starting position', () => {
    expect(openingAt([DEFAULT_POSITION])).toBeNull();
  });

  it('names the opening a line is in', () => {
    expect(openingAt(fensAlong('e4', 'c5'))).toEqual({
      eco: 'B20',
      name: 'Sicilian Defense',
    });
  });

  it('keeps the name once the moves leave the book', () => {
    expect(openingAt(fensAlong('e4', 'c5', 'Ke2', 'Qa5'))?.name).toMatch(
      /^Sicilian Defense/,
    );
  });

  it('finds an opening reached in another order', () => {
    const zukertort = {
      eco: 'D02',
      name: "Queen's Pawn Game: Zukertort Variation",
    };

    expect(openingAt(fensAlong('d4', 'd5', 'Nf3'))).toEqual(zukertort);
    expect(openingAt(fensAlong('Nf3', 'd5', 'd4'))).toEqual(zukertort);
  });
});

describe('bookMovesFrom', () => {
  const AFTER_E4_E5 =
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

  it('gives the moves from a position that the book names, with the opening each reaches', () => {
    const moves = bookMovesFrom(AFTER_E4_E5);
    const byUci = Object.fromEntries(
      moves.map((move) => [move.uci, move.opening.name]),
    );

    expect(byUci.g1f3).toBe("King's Knight Opening");
    expect(byUci.f2f4).toBe("King's Gambit");
    expect(moves.find((move) => move.uci === 'g1f3')?.san).toBe('Nf3');
    // A legal move no book has.
    expect(byUci.g2g4).toBeUndefined();
  });

  it('gives the first moves from the starting position', () => {
    const ucis = bookMovesFrom(DEFAULT_POSITION).map((move) => move.uci);

    expect(ucis).toEqual(expect.arrayContaining(['e2e4', 'd2d4', 'c2c4']));
  });

  it('gives none once out of the book', () => {
    expect(bookMovesFrom('8/8/4k3/8/8/4K3/8/8 w - - 0 60')).toEqual([]);
  });
});

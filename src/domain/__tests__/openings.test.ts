import { Chess, DEFAULT_POSITION } from 'chess.js';

import { epd, openingAt } from '../openings';

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

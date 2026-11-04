import { DEFAULT_POSITION } from 'chess.js';

import {
  evalBarFraction,
  finalScore,
  formatScore,
  numberMoves,
  pvToSan,
  SanCache,
  toWhitePov,
} from '../evalScore';

describe('toWhitePov', () => {
  it("keeps white's score, and turns black's round", () => {
    expect(toWhitePov({ kind: 'cp', value: 35 }, 'w')).toEqual({
      kind: 'cp',
      cp: 35,
    });
    expect(toWhitePov({ kind: 'cp', value: 35 }, 'b')).toEqual({
      kind: 'cp',
      cp: -35,
    });
  });

  it('names who mates', () => {
    expect(toWhitePov({ kind: 'mate', value: 2 }, 'b')).toEqual({
      kind: 'mate',
      moves: 2,
      winner: 'b',
    });
    expect(toWhitePov({ kind: 'mate', value: -3 }, 'b')).toEqual({
      kind: 'mate',
      moves: 3,
      winner: 'w',
    });
  });

  it('counts the side to move as mated at mate 0', () => {
    expect(toWhitePov({ kind: 'mate', value: 0 }, 'w')).toMatchObject({
      winner: 'b',
    });
  });
});

describe('formatScore', () => {
  it.each([
    [{ kind: 'cp', cp: 34 }, '+0.3'],
    [{ kind: 'cp', cp: 25 }, '+0.3'],
    [{ kind: 'cp', cp: -25 }, '-0.3'],
    [{ kind: 'cp', cp: -120 }, '-1.2'],
    [{ kind: 'cp', cp: 4 }, '0.0'],
    [{ kind: 'cp', cp: 0 }, '0.0'],
    [{ kind: 'mate', moves: 3, winner: 'w' }, '#3'],
    [{ kind: 'mate', moves: 2, winner: 'b' }, '-#2'],
    [{ kind: 'mate', moves: 0, winner: 'w' }, '1-0'],
    [{ kind: 'mate', moves: 0, winner: 'b' }, '0-1'],
  ] as const)('shows %j as %s', (score, text) => {
    expect(formatScore(score)).toBe(text);
  });
});

describe('evalBarFraction', () => {
  it('splits the bar evenly when level', () => {
    expect(evalBarFraction({ kind: 'cp', cp: 0 })).toBeCloseTo(0.5);
  });

  it("gives more of it to the side that's better, never all of it", () => {
    const pawnUp = evalBarFraction({ kind: 'cp', cp: 100 });
    const rookUp = evalBarFraction({ kind: 'cp', cp: 500 });

    expect(pawnUp).toBeGreaterThan(0.55);
    expect(rookUp).toBeGreaterThan(pawnUp);
    expect(evalBarFraction({ kind: 'cp', cp: 5000 })).toBeLessThan(1);
    expect(evalBarFraction({ kind: 'cp', cp: -100 })).toBeCloseTo(1 - pawnUp);
  });

  it('fills it for a mate', () => {
    expect(evalBarFraction({ kind: 'mate', moves: 4, winner: 'w' })).toBe(1);
    expect(evalBarFraction({ kind: 'mate', moves: 4, winner: 'b' })).toBe(0);
  });
});

describe('finalScore', () => {
  it('is null while the game goes on', () => {
    expect(finalScore(DEFAULT_POSITION)).toBeNull();
  });

  it('is mate for the side that gave it', () => {
    // Fool's mate.
    expect(
      finalScore(
        'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
      ),
    ).toEqual({ kind: 'mate', moves: 0, winner: 'b' });
  });

  it('is level for a stalemate', () => {
    expect(finalScore('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).toEqual({
      kind: 'cp',
      cp: 0,
    });
  });
});

describe('pvToSan', () => {
  it('writes an engine line as SAN, as far as asked', () => {
    expect(
      pvToSan(DEFAULT_POSITION, ['e2e4', 'e7e5', 'g1f3', 'b8c6'], 3),
    ).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('reads moves it has written before from a cache, and writes new ones to it', () => {
    const cache: SanCache = new Map();
    pvToSan(DEFAULT_POSITION, ['e2e4', 'e7e5'], undefined, cache);
    expect(cache.size).toBe(2);

    expect(
      pvToSan(DEFAULT_POSITION, ['e2e4', 'e7e5', 'g1f3'], undefined, cache),
    ).toEqual(['e4', 'e5', 'Nf3']);
    expect(cache.size).toBe(3);
  });

  it('stops at a move that is not legal', () => {
    expect(pvToSan(DEFAULT_POSITION, ['e2e4', 'e2e4'])).toEqual(['e4']);
  });

  it('writes a promotion', () => {
    expect(pvToSan('7k/4P3/8/8/8/8/8/4K3 w - - 0 1', ['e7e8q'])).toEqual([
      'e8=Q+',
    ]);
  });
});

describe('numberMoves', () => {
  it("numbers a line from white's move, on from the position's move number", () => {
    expect(
      numberMoves('4k3/8/8/8/8/8/8/4K3 w - - 0 12', ['Kd2', 'Kd7', 'Ke3']),
    ).toEqual([
      { label: '12.', san: 'Kd2' },
      { label: null, san: 'Kd7' },
      { label: '13.', san: 'Ke3' },
    ]);
  });

  it("numbers a line from black's move with an ellipsis first", () => {
    expect(
      numberMoves('4k3/8/8/8/8/8/8/4K3 b - - 0 1', ['Kd7', 'Kd2']),
    ).toEqual([
      { label: '1...', san: 'Kd7' },
      { label: '2.', san: 'Kd2' },
    ]);
  });
});

import { Chess, Move } from 'chess.js';

import { EngineScore } from '../../evalScore';
import {
  isFork,
  lineMaterial,
  materialBalance,
  MoveContext,
  moveFacts,
  pinnedOrSkewered,
  sacrificeOf,
} from '../motifs';
import { MoveClass } from '../types';

const cp = (value: number): EngineScore => ({ kind: 'cp', cp: value });

function play(fen: string, uci: string): Move {
  return new Chess(fen).move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4],
  });
}

function factsOf(
  fen: string,
  uci: string,
  moveClass: MoveClass,
  context: Partial<MoveContext> = {},
) {
  const move = play(fen, uci);
  return moveFacts({
    fenBefore: fen,
    fenAfter: move.after,
    move,
    moveClass,
    scoreBefore: cp(0),
    scoreAfter: cp(0),
    bestLine: [],
    replyLine: [],
    ply: 30,
    opening: null,
    ...context,
  });
}

describe('material', () => {
  it('counts how far a side is ahead', () => {
    expect(materialBalance('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'w')).toBe(5);
    expect(materialBalance('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'b')).toBe(-5);
  });

  it('follows a line, keeping the biggest piece taken', () => {
    const fen = '4k3/8/8/8/3n4/8/5K2/R7 w - - 0 1';
    const line = lineMaterial(fen, ['f2e1', 'd4c2', 'e1d2', 'c2a1'], 'w');
    expect(line.gain).toBe(-5);
    expect(line.lost).toEqual({ type: 'r', ply: 3 });
  });
});

describe('patterns', () => {
  it('sees a knight forking king and rook', () => {
    const chess = new Chess('r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1');
    expect(isFork(chess, 'c7')).toBe(true);
  });

  it('sees a pin on a rook in front of the king', () => {
    const chess = new Chess('4k3/8/8/8/1b6/2R5/8/4K3 w - - 0 1');
    expect(pinnedOrSkewered(chess, 'b4')).toBe('r');
  });

  it('sees a skewer through the king to a rook', () => {
    const chess = new Chess('3r4/8/8/3k4/8/8/8/3QK3 b - - 0 1');
    expect(pinnedOrSkewered(chess, 'd1')).toBe('r');
  });

  it('sees nothing with a single piece on the line', () => {
    const chess = new Chess('8/8/8/r2k4/8/8/8/3QK3 b - - 0 1');
    expect(pinnedOrSkewered(chess, 'd1')).toBeNull();
  });

  it('calls a piece left where a pawn takes it a sacrifice', () => {
    const move = play(
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'f1b5',
    );
    expect(sacrificeOf(move, [])).toBeNull();
    const sac = play(
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'f1a6',
    );
    expect(sacrificeOf(sac, [])).toBe('b');
    expect(sacrificeOf(sac, ['b7a6', 'd2d4'])).toBe('b');
  });

  it("doesn't call a defended piece next to the king a sacrifice", () => {
    // Bxh7+ with the knight on g5 guarding h7: the king can't take it.
    const move = play(
      'r2r2k1/1b1p1ppp/pp2p3/6N1/3P1n2/P1PB4/1PP2PPP/4RRK1 w - - 4 18',
      'd3h7',
    );
    expect(sacrificeOf(move, ['g8f8'])).toBeNull();
  });

  describe('a queen taking a rook a pawn guards', () => {
    const fen = 'r5k1/5ppp/4p3/3r4/8/8/5PPP/R2Q2K1 w - - 0 1';
    const move = play(fen, 'd1d5');

    it("isn't a sacrifice when the other rook falls at once: a trade", () => {
      expect(sacrificeOf(move, ['e6d5', 'a1a8'])).toBeNull();
    });

    it('is one when nothing comes back', () => {
      expect(sacrificeOf(move, ['e6d5', 'h2h3'])).toBe('q');
    });
  });

  describe('a move leaving another piece where it can be taken', () => {
    // 18. Ng5, from a game: the knight steps off the h5-e2 diagonal, leaving
    // the bishop on e2 to the bishop on h5, for Qxh7 mate.
    const move = play(
      '5rk1/pp3ppp/4p3/7b/1n1PQB2/2q1PN1P/4BPP1/5RK1 w - - 0 18',
      'f3g5',
    );

    it('is a sacrifice of that piece, turned down', () => {
      expect(sacrificeOf(move, ['h5g6', 'e4b7'])).toBe('b');
    });

    it('is one taken too', () => {
      expect(sacrificeOf(move, ['h5e2', 'e4h7'])).toBe('b');
    });
  });

  it("isn't a sacrifice when nothing is left to be taken", () => {
    // Nothing left loose by the move; an exchange that evens out.
    const move = play(
      'rnbqkbnr/ppp2ppp/8/3pp3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3',
      'e4d5',
    );
    expect(sacrificeOf(move, ['d8d5', 'c3d5'])).toBeNull();
  });

  it("isn't a sacrifice when the answer takes something else first", () => {
    // Bxe5 takes the knight, leaving the knight on h4 to the queen - but the
    // queen takes back on e5, and h4 stays.
    const move = play(
      '2kr3r/pbppnp1p/1p3qp1/2b1n3/2B1P2N/2NQ2B1/PPP2PPP/2KR3R w - - 6 16',
      'g3e5',
    );
    expect(sacrificeOf(move, ['f6e5', 'h4f3'])).toBeNull();
  });

  it('is a sacrifice of a piece left under attack when it could be kept', () => {
    // 17...Qg4, from a game: the bishop on h6 attacks the rook on f8, which
    // Rfd8 would have saved; Qg4 leaves it, Bxf8 losing to Qxg2 mate.
    const move = play(
      'r4rk1/pp3p1p/2b3pB/8/3q4/1Q6/PP3PPP/R4RK1 b - - 1 17',
      'd4g4',
    );
    expect(sacrificeOf(move, ['f2f3', 'g4d4'])).toBe('r');
    // Taken, and only a bishop back for the rook: one too.
    expect(sacrificeOf(move, ['h6f8', 'a8f8'])).toBe('r');
  });

  it("isn't a sacrifice to leave a piece whose taking only trades", () => {
    // 5...b5, from a game: the knight on c6 stays where the d5 pawn takes it,
    // but dxc6 bxc4 wins the bishop back.
    const move = play(
      'r1bqkb1r/ppp2ppp/2n2n2/3Pp1N1/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 5',
      'b7b5',
    );
    expect(sacrificeOf(move, ['c4f1', 'c6d4'])).toBeNull();
  });

  it("doesn't count winning back material that loses the piece taking it", () => {
    // 26...Bxf3, from a game: after gxf3, Qxd1 takes a rook but the queen on
    // g1 takes the queen back - the bishop's given up, not traded.
    const move = play(
      '4r1k1/pp5p/2b2ppB/8/8/5P2/PP2q1PP/3R2QK b - - 3 26',
      'c6f3',
    );
    expect(sacrificeOf(move, ['d1f1', 'f3c6'])).toBe('b');
  });

  it("isn't a sacrifice to check, leaving a piece the answer can't take", () => {
    // Qb3+: the rook on c2 hangs to nothing once the king has moved, and the
    // knight on e7 can't be taken while the king's in check.
    const move = play(
      '5b1r/p3nkpp/8/4pq2/8/5Q2/PPrP1PPP/RNB1K2R w KQ - 2 14',
      'f3b3',
    );
    expect(sacrificeOf(move, ['f7g6', 'b3c2'])).toBeNull();
  });

  it("isn't a sacrifice to mate", () => {
    const move = play(
      'r3k2r/pp1n1N2/4K2p/2pQ4/1b6/P1P1P1p1/1Pq4P/RN5R b kq - 3 21',
      'c2g6',
    );
    expect(sacrificeOf(move, [])).toBeNull();
  });

  it('is a sacrifice of what the move left, not of what was already lost', () => {
    // Kb1 leaves the rook on d1 unguarded; the knight takes the rook on g3,
    // which it was attacking already.
    const move = play(
      'r6r/2k2B2/p1p5/1p2pN1p/4P1pP/6R1/PPP1n2P/2KR4 w - - 2 31',
      'c1b1',
    );
    expect(sacrificeOf(move, ['e2g3', 'h2g3', 'a8f8'])).toBeNull();
  });
});

describe('moveFacts for a slip', () => {
  const afterE5 =
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

  it('names a piece left hanging', () => {
    expect(
      factsOf(afterE5, 'f1a6', 'blunder', {
        replyLine: ['b7a6', 'g1f3'],
        bestLine: ['g1f3', 'b8c6'],
      })[0],
    ).toEqual({ kind: 'hangs', piece: 'bishop' });
  });

  it('names a fork it allows', () => {
    expect(
      factsOf('4k3/8/8/8/3n4/8/5K2/R7 w - - 0 1', 'f2e1', 'blunder', {
        replyLine: ['d4c2', 'e1d2', 'c2a1'],
        bestLine: ['a1a8', 'e8d7'],
      })[0],
    ).toEqual({ kind: 'allowsFork', piece: 'knight' });
  });

  it('names a piece that ends up trapped', () => {
    expect(
      factsOf('2k5/ppp5/8/8/8/4B3/8/4K3 w - - 0 1', 'e3a7', 'mistake', {
        replyLine: ['b7b6', 'e1e2', 'c8b7', 'e2e3', 'b7a7'],
        bestLine: ['e1d2', 'c8d7'],
      })[0],
    ).toEqual({ kind: 'trapped', piece: 'bishop' });
  });

  it('names a mate it allows', () => {
    expect(
      factsOf(afterE5, 'g1f3', 'blunder', {
        scoreAfter: { kind: 'mate', moves: 2, winner: 'b' },
      })[0],
    ).toEqual({ kind: 'allowsMate', moves: 2 });
  });

  it('names a mate it misses', () => {
    expect(
      factsOf(afterE5, 'g1f3', 'blunder', {
        scoreBefore: { kind: 'mate', moves: 3, winner: 'w' },
        scoreAfter: cp(200),
      })[0],
    ).toEqual({ kind: 'missesMate', moves: 3 });
  });

  it('names material it could have won', () => {
    expect(
      factsOf('4k3/8/8/3q4/8/8/P7/3RK3 w - - 0 1', 'a2a3', 'miss', {
        bestLine: ['d1d5', 'e8e7'],
        replyLine: ['d5h5', 'a3a4'],
      })[0],
    ).toEqual({ kind: 'missesWin', piece: 'queen' });
  });

  it("says only that it slipped when there's nothing to name", () => {
    expect(factsOf(afterE5, 'a2a3', 'inaccuracy')).toEqual([{ kind: 'slips' }]);
  });
});

describe('moveFacts for a good move', () => {
  it('names a fork', () => {
    expect(
      factsOf('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'b5c7', 'best', {
        replyLine: ['e8d8', 'c7a8'],
      })[0],
    ).toEqual({ kind: 'fork', piece: 'knight' });
  });

  it('names taking a piece left undefended', () => {
    expect(
      factsOf('4k3/8/8/3n4/8/8/8/3RK3 w - - 0 1', 'd1d5', 'best', {
        replyLine: ['e8e7'],
      })[0],
    ).toEqual({ kind: 'takesFree', piece: 'knight' });
  });

  it('names checkmate', () => {
    expect(
      factsOf('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'a1a8', 'best'),
    ).toEqual([{ kind: 'mates' }]);
  });

  it('names castling', () => {
    expect(
      factsOf(
        'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        'e1g1',
        'best',
        { ply: 7 },
      ),
    ).toContainEqual({ kind: 'castles', side: 'king' });
  });

  it('names developing and the center early on', () => {
    const start = new Chess().fen();
    expect(factsOf(start, 'g1f3', 'best', { ply: 1 })).toContainEqual({
      kind: 'develops',
      piece: 'knight',
    });
    expect(factsOf(start, 'e2e4', 'best', { ply: 1 })).toContainEqual({
      kind: 'centre',
    });
  });

  it('names a piece saved from capture', () => {
    expect(
      factsOf('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', 'e4c3', 'best'),
    ).toContainEqual({ kind: 'saves', piece: 'knight' });
  });

  it('names a book move by its opening', () => {
    expect(
      factsOf(new Chess().fen(), 'e2e4', 'book', { opening: "King's Pawn" }),
    ).toEqual([{ kind: 'book', opening: "King's Pawn" }]);
  });
});

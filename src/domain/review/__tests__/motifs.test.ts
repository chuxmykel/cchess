import { Chess, Move } from 'chess.js';

import { EngineScore } from '../../evalScore';
import {
  isFork,
  isSacrifice,
  lineMaterial,
  materialBalance,
  MoveContext,
  moveFacts,
  pinnedOrSkewered,
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
    expect(isSacrifice(move)).toBe(false);
    const sac = play(
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'f1a6',
    );
    expect(isSacrifice(sac)).toBe(true);
  });

  it("doesn't call a defended piece next to the king a sacrifice", () => {
    // Bxh7+ with the knight on g5 guarding h7: the king can't take it.
    const move = play(
      'r2r2k1/1b1p1ppp/pp2p3/6N1/3P1n2/P1PB4/1PP2PPP/4RRK1 w - - 4 18',
      'd3h7',
    );
    expect(isSacrifice(move)).toBe(false);
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

  it('says only that it slipped when there’s nothing to name', () => {
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

import { parseUciLine } from '../uci';

describe('parseUciLine', () => {
  it('reads an info line: depth, which line, score and moves', () => {
    expect(
      parseUciLine(
        'info depth 18 seldepth 24 multipv 2 score cp -23 nodes 81234 nps 400000 hashfull 12 time 203 pv g8f6 c2c4 e7e6',
      ),
    ).toEqual({
      type: 'info',
      depth: 18,
      multipv: 2,
      score: { kind: 'cp', value: -23 },
      bound: undefined,
      pv: ['g8f6', 'c2c4', 'e7e6'],
    });
  });

  it('takes the first line when no multipv is given', () => {
    expect(parseUciLine('info depth 3 score cp 40 pv e2e4')).toMatchObject({
      multipv: 1,
    });
  });

  it('reads mate scores, either way', () => {
    expect(parseUciLine('info depth 9 score mate 3 pv d1h5')).toMatchObject({
      score: { kind: 'mate', value: 3 },
    });
    expect(parseUciLine('info depth 9 score mate -2 pv g2g4')).toMatchObject({
      score: { kind: 'mate', value: -2 },
    });
  });

  it('marks a score the search has only bounded', () => {
    expect(
      parseUciLine('info depth 12 score cp 31 lowerbound pv e2e4'),
    ).toMatchObject({ bound: 'lower' });
    expect(
      parseUciLine('info depth 12 score cp 20 upperbound pv e2e4'),
    ).toMatchObject({ bound: 'upper' });
  });

  it('skips info without a line of moves', () => {
    expect(
      parseUciLine('info depth 1 currmove e2e4 currmovenumber 1'),
    ).toBeNull();
    expect(parseUciLine('info depth 0 score mate 0')).toBeNull();
    expect(
      parseUciLine('info string NNUE evaluation using nn.nnue'),
    ).toBeNull();
  });

  it('reads the best move, or none when there is no legal move', () => {
    expect(parseUciLine('bestmove e2e4 ponder e7e5')).toEqual({
      type: 'bestmove',
      move: 'e2e4',
    });
    expect(parseUciLine('bestmove (none)')).toEqual({
      type: 'bestmove',
      move: null,
    });
  });

  it('reads the handshake replies, and ignores the rest', () => {
    expect(parseUciLine('uciok')).toEqual({ type: 'uciok' });
    expect(parseUciLine('readyok')).toEqual({ type: 'readyok' });
    expect(parseUciLine('Stockfish 19 by the Stockfish developers')).toBeNull();
    expect(parseUciLine('id name Stockfish 19')).toBeNull();
  });
});

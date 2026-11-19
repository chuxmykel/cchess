import { DEFAULT_POSITION } from 'chess.js';

import { parseImport } from '../pgnImport';

describe('parseImport', () => {
  it('takes a FEN as a position with no moves', () => {
    expect(parseImport('  4k3/8/8/8/4P3/8/8/4K3 w - - 0 1\n')).toEqual({
      ok: true,
      startFen: '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1',
      uciMoves: [],
    });
  });

  it("takes a PGN's moves from the usual start", () => {
    const result = parseImport(`[Event "Casual"]
[White "a"]
[Black "b"]

1. e4 e5 2. Nf3 {a comment} Nc6 (2... d6 3. d4) 3. Bb5 a6 1-0`);

    expect(result).toMatchObject({
      ok: true,
      startFen: DEFAULT_POSITION,
      uciMoves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6'],
    });
  });

  it("reads lichess's annotated PGNs, comments one after another and all", () => {
    const pgn = [
      '[Event "rated bullet game"]',
      '[Site "https://lichess.org/game/VDYB8jjr"]',
      '[Result "0-1"]',
      '[Annotator "lichess.org"]',
      '',
      '1. d4 { [%clk 0:02:00] } 1... e5 { [%clk 0:02:00] } 2. dxe5 { [%clk 0:02:00] }',
      '2... Nc6 { [%clk 0:02:00] } 3. Nf3 { [%clk 0:02:00] } 3... Qe7 { [%clk 0:02:01] }',
      '{ A40 Englund Gambit: Main Line } 4. Bf4 { [%clk 0:02:01] } 4... Qb4+ ; a check',
      '5. Bd2 { [%clk 0:00:10] } { Black wins on time. } 0-1',
    ].join('\r\n');

    const result = parseImport(pgn);

    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.uciMoves).toEqual([
      'd2d4',
      'e7e5',
      'd4e5',
      'b8c6',
      'g1f3',
      'd8e7',
      'c1f4',
      'e7b4',
      'f4d2',
    ]);
  });

  it('starts from the [FEN] tag when there is one', () => {
    const fen = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';
    const result = parseImport(`[SetUp "1"]
[FEN "${fen}"]

1. e8=Q+ 1-0`);

    expect(result).toMatchObject({
      ok: true,
      startFen: fen,
      uciMoves: ['e7e8q'],
    });
  });

  it("reads the players and the result from a PGN's tags", () => {
    const result = parseImport(`[White "Carlsen, Magnus"]
[Black "Nepomniachtchi, Ian"]
[WhiteElo "2856"]
[BlackElo "2782"]
[Result "1/2-1/2"]

1. e4 e5 1/2-1/2`);

    expect(result.ok && result.game).toEqual({
      white: { name: 'Carlsen, Magnus', rating: 2856 },
      black: { name: 'Nepomniachtchi, Ian', rating: 2782 },
      result: 'draw',
    });
  });

  it("leaves out what a PGN's tags don't say", () => {
    const result = parseImport(`[White "?"]
[WhiteElo "?"]
[BlackElo "-"]

1. e4 e5 *`);

    expect(result.ok && result.game).toEqual({
      white: { name: null, rating: null },
      black: { name: null, rating: null },
      result: null,
    });
  });

  it('takes the result from the end of the moves, with no tag for it', () => {
    expect(parseImport('1. e4 e5 0-1')).toMatchObject({
      game: { result: 'black' },
    });
    expect(parseImport('1. e4 e5 1-0')).toMatchObject({
      game: { result: 'white' },
    });
  });

  it('says nothing of a game for a FEN', () => {
    expect(parseImport('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1')).not.toHaveProperty(
      'game',
    );
  });

  it('explains what it can not read', () => {
    expect(parseImport('')).toMatchObject({ ok: false });
    expect(parseImport('1. e4 e5 2. Qxf9')).toMatchObject({ ok: false });
    expect(parseImport('[Event "Nothing"]')).toEqual({
      ok: false,
      error: 'There are no moves in that PGN.',
    });
  });
});

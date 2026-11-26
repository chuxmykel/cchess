import { Chess, DEFAULT_POSITION } from 'chess.js';

import { addMove, treeFromMoves, uciToMoveSpec } from '../analysisTree';
import { analysisToPgn } from '../pgnExport';
import { parseImport } from '../pgnImport';

const START = new Chess(DEFAULT_POSITION).fen();

describe('analysisToPgn', () => {
  it('writes the main line under the Seven Tag Roster, left unknown', () => {
    const { tree } = treeFromMoves(START, ['e2e4', 'e7e5', 'g1f3']);

    expect(analysisToPgn(tree)).toBe(
      [
        '[Event "?"]',
        '[Site "?"]',
        '[Date "????.??.??"]',
        '[Round "?"]',
        '[White "?"]',
        '[Black "?"]',
        '[Result "*"]',
        '',
        '1. e4 e5 2. Nf3 *',
      ].join('\n'),
    );
  });

  it('brackets each variation after the move it replaces, numbering on', () => {
    const { tree, line } = treeFromMoves(START, ['e2e4', 'e7e5', 'g1f3']);
    // 1...c5 2.Nf3 in place of 1...e5, and 2.Bc4 in place of 2.Nf3.
    let added = addMove(tree, line[0], uciToMoveSpec('c7c5'))!;
    added = addMove(added.tree, added.nodeId, uciToMoveSpec('g1f3'))!;
    added = addMove(added.tree, line[1], uciToMoveSpec('f1c4'))!;

    expect(analysisToPgn(added.tree).split('\n\n')[1]).toBe(
      '1. e4 e5 (1... c5 2. Nf3) 2. Nf3 (2. Bc4) *',
    );
  });

  it('gives a set-up position its FEN, numbering from it', () => {
    const fen = '4k3/8/8/8/8/8/4P3/4K3 b - - 0 12';
    const { tree } = treeFromMoves(fen, ['e8d7', 'e2e4']);
    const pgn = analysisToPgn(tree);

    expect(pgn).toContain('[SetUp "1"]');
    expect(pgn).toContain(`[FEN "${fen}"]`);
    expect(pgn.split('\n\n')[1]).toBe('12... Kd7 13. e4 *');
  });

  it('writes no moves for an analysis with none', () => {
    const { tree } = treeFromMoves(START, []);

    expect(analysisToPgn(tree).split('\n\n')[1]).toBe('*');
  });

  it('reads back in as the same start and main line', () => {
    const fen = '4k3/8/8/8/8/8/4P3/4K3 b - - 0 12';
    const { tree, line } = treeFromMoves(fen, ['e8d7', 'e2e4', 'd7e6']);
    const withVariation = addMove(tree, line[0], uciToMoveSpec('e2e3'))!;

    expect(parseImport(analysisToPgn(withVariation.tree))).toMatchObject({
      ok: true,
      startFen: fen,
      uciMoves: ['e8d7', 'e2e4', 'd7e6'],
    });
  });
});

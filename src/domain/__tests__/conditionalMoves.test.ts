import {
  MAX_CONDITIONAL_LINES,
  addLine,
  canAddLine,
  deleteLine,
  deleteMove,
  editorFrom,
  fenAfterLine,
  lastMoveOfLine,
  lineRows,
  linesToSave,
  playMove,
  selectLine,
} from '../conditionalMoves';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

describe('the conditional moves editor', () => {
  it('starts on one empty line, or on the last of those saved', () => {
    expect(editorFrom([])).toEqual({ lines: [[]], current: 0 });
    expect(
      editorFrom([
        ['e7e5', 'g1f3'],
        ['c7c5', 'g1f3'],
      ]).current,
    ).toBe(1);
  });

  it('writes moves on the line being written, and takes them back', () => {
    let editor = editorFrom([]);
    editor = playMove(editor, 'e7e5');
    editor = playMove(editor, 'g1f3');
    expect(editor.lines).toEqual([['e7e5', 'g1f3']]);

    expect(deleteMove(editor).lines).toEqual([['e7e5']]);
  });

  it('adds a line only once this one has a move, and at most ten', () => {
    const empty = editorFrom([]);
    expect(addLine(empty)).toBe(empty);

    const added = addLine(playMove(empty, 'e7e5'));
    expect(added).toEqual({ lines: [['e7e5'], []], current: 1 });

    const full = editorFrom(
      Array.from({ length: MAX_CONDITIONAL_LINES }, () => ['e7e5', 'g1f3']),
    );
    expect(canAddLine(full)).toBe(false);
  });

  it('selects and deletes lines, keeping one to write on', () => {
    const editor = editorFrom([
      ['e7e5', 'g1f3'],
      ['c7c5', 'g1f3'],
    ]);
    expect(selectLine(editor, 0).current).toBe(0);
    expect(deleteLine(editor, 1)).toEqual({
      lines: [['e7e5', 'g1f3']],
      current: 0,
    });
    expect(deleteLine(deleteLine(editor, 0), 0)).toEqual({
      lines: [[]],
      current: 0,
    });
  });

  it('saves each line to its last reply, leaving empty ones out', () => {
    expect(
      linesToSave({
        lines: [['e7e5', 'g1f3', 'b8c6'], ['c7c5'], []],
        current: 0,
      }),
    ).toEqual([['e7e5', 'g1f3']]);
  });

  it('reads a line in rows of white and black, from the game position', () => {
    expect(lineRows(AFTER_E4, ['e7e5', 'g1f3', 'b8c6'])).toEqual([
      { number: 1, white: null, black: 'e5' },
      { number: 2, white: 'Nf3', black: 'Nc6' },
    ]);
    expect(fenAfterLine(AFTER_E4, ['e7e5'])).toBe(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    );
  });

  it("marks a line's last move, with the piece that made it", () => {
    expect(lastMoveOfLine(AFTER_E4, [])).toBeNull();
    expect(lastMoveOfLine(AFTER_E4, ['e7e5', 'g1f3'])).toEqual({
      from: 'g1',
      to: 'f3',
      piece: 'n',
    });
  });
});

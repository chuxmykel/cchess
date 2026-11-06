import { Chess } from 'chess.js';

import { uciToMoveSpec } from './analysisTree';
import { pvToSan } from './evalScore';
import { PlayedMove } from './lastMoveSquares';

/** The most lines a player keeps for a game - the server's limit. */
export const MAX_CONDITIONAL_LINES = 10;

/**
 * Conditional moves being written: each line the opponent's move, your
 * reply, theirs..., in UCI, from the game's position - and the line the
 * board's moves go on.
 */
export type ConditionalEditor = { lines: string[][]; current: number };

/** An editor on the lines saved - or one empty line, to start on. */
export function editorFrom(saved: string[][]): ConditionalEditor {
  return saved.length > 0
    ? { lines: saved.map((line) => [...line]), current: saved.length - 1 }
    : { lines: [[]], current: 0 };
}

function withCurrent(
  editor: ConditionalEditor,
  change: (line: string[]) => string[],
): ConditionalEditor {
  return {
    ...editor,
    lines: editor.lines.map((line, index) =>
      index === editor.current ? change(line) : line,
    ),
  };
}

/** A move played on the board, at the end of the line being written. */
export function playMove(
  editor: ConditionalEditor,
  uci: string,
): ConditionalEditor {
  return withCurrent(editor, (line) => [...line, uci]);
}

/** The line being written, its last move taken back. */
export function deleteMove(editor: ConditionalEditor): ConditionalEditor {
  return withCurrent(editor, (line) => line.slice(0, -1));
}

/** Whether another line can be started: this one has a move, and there's
 * room for one more. */
export function canAddLine(editor: ConditionalEditor): boolean {
  return (
    editor.lines[editor.current].length > 0 &&
    editor.lines.length < MAX_CONDITIONAL_LINES
  );
}

/** A new, empty line to write, from the game's position. */
export function addLine(editor: ConditionalEditor): ConditionalEditor {
  if (!canAddLine(editor)) return editor;
  return { lines: [...editor.lines, []], current: editor.lines.length };
}

export function selectLine(
  editor: ConditionalEditor,
  index: number,
): ConditionalEditor {
  return index >= 0 && index < editor.lines.length
    ? { ...editor, current: index }
    : editor;
}

/** A line gone - the last one leaving an empty line to write on. */
export function deleteLine(
  editor: ConditionalEditor,
  index: number,
): ConditionalEditor {
  const lines = editor.lines.filter((_, at) => at !== index);
  if (lines.length === 0) return { lines: [[]], current: 0 };
  const current =
    editor.current > index || editor.current === lines.length
      ? editor.current - 1
      : editor.current;
  return { lines, current: Math.max(0, current) };
}

/** What's saved of the lines: each to its last reply, empty ones left. */
export function linesToSave(editor: ConditionalEditor): string[][] {
  return editor.lines
    .map((line) => line.slice(0, line.length - (line.length % 2)))
    .filter((line) => line.length > 0);
}

/** The position at the end of a line, from the game's. */
export function fenAfterLine(fen: string, line: string[]): string {
  const chess = new Chess(fen);
  for (const uci of line) chess.move(uciToMoveSpec(uci));
  return chess.fen();
}

/** The last move of a line, for the board to mark - null with none. */
export function lastMoveOfLine(fen: string, line: string[]): PlayedMove | null {
  const last = line.at(-1);
  if (!last) return null;
  const { from, to } = uciToMoveSpec(last);
  const piece = new Chess(fenAfterLine(fen, line.slice(0, -1))).get(from);
  return piece ? { from, to, piece: piece.type } : null;
}

/** A line's moves as a two-column list reads them: each move number with
 * white's move and black's - "6... d5" starting with black's. */
export type LineRow = {
  number: number;
  white: string | null;
  black: string | null;
};

export function lineRows(fen: string, line: string[]): LineRow[] {
  const [, turn, , , , fullMove] = fen.split(' ');
  let number = Number(fullMove) || 1;
  const rows: LineRow[] = [];
  let row: LineRow | null = null;
  let white = turn !== 'b';
  for (const san of pvToSan(fen, line)) {
    if (white) {
      row = { number, white: san, black: null };
      rows.push(row);
    } else {
      if (!row) {
        row = { number, white: null, black: san };
        rows.push(row);
      } else {
        row.black = san;
      }
      row = null;
      number += 1;
    }
    white = !white;
  }
  return rows;
}

import { Chess, DEFAULT_POSITION, validateFen } from 'chess.js';

import { uciOf } from './analysisTree';

export type ImportResult =
  | { ok: true; startFen: string; uciMoves: string[] }
  | { ok: false; error: string };

// A game or position pasted in to analyse: a FEN, or a PGN - from the usual
// start or from its [FEN] tag. Only a PGN's main line comes in; its
// variations and comments don't.
export function parseImport(text: string): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Paste a PGN or a FEN.' };

  if (validateFen(trimmed).ok) {
    return { ok: true, startFen: new Chess(trimmed).fen(), uciMoves: [] };
  }

  const chess = new Chess();
  try {
    chess.loadPgn(withoutComments(trimmed));
  } catch {
    return {
      ok: false,
      error: "That isn't a PGN or a FEN this can read.",
    };
  }
  const moves = chess.history({ verbose: true });
  const tagFen = chess.getHeaders().FEN;
  if (moves.length === 0 && !tagFen) {
    return { ok: false, error: 'There are no moves in that PGN.' };
  }
  return {
    ok: true,
    startFen: moves[0]?.before ?? new Chess(tagFen ?? DEFAULT_POSITION).fen(),
    uciMoves: moves.map(uciOf),
  };
}

// A PGN's moves without their comments - `{ ... }`, or `;` to the end of the
// line - which aren't brought in anyway. chess.js can't read two in a row,
// as lichess writes them (a clock, then the opening's name).
function withoutComments(pgn: string): string {
  return pgn
    .split(/\r?\n/)
    .map((line) =>
      line.trimStart().startsWith('[') ? line : line.replace(/;.*$/, ''),
    )
    .join('\n')
    .replace(/\{[^}]*\}/g, ' ');
}

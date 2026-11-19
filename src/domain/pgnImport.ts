import { Chess, DEFAULT_POSITION, validateFen } from 'chess.js';

import { uciOf } from './analysisTree';

// A side of a game brought in, as its PGN's tags name it - null where they
// don't say.
export type ImportedPlayer = { name: string | null; rating: number | null };

// What a PGN says of the game beyond its moves: who played it, and how it
// ended - null while it hadn't, or it doesn't say.
export type ImportedGame = {
  white: ImportedPlayer;
  black: ImportedPlayer;
  result: 'white' | 'black' | 'draw' | null;
};

export type ImportResult =
  | { ok: true; startFen: string; uciMoves: string[]; game?: ImportedGame }
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
    game: gameOf(chess.getHeaders()),
  };
}

const RESULTS: Record<string, ImportedGame['result']> = {
  '1-0': 'white',
  '0-1': 'black',
  '1/2-1/2': 'draw',
};

// The players and result from a PGN's tags. chess.js fills in the ones
// left out with "?", and the result from the moves' end.
function gameOf(headers: Record<string, string | undefined>): ImportedGame {
  return {
    white: playerOf(headers.White, headers.WhiteElo),
    black: playerOf(headers.Black, headers.BlackElo),
    result: RESULTS[headers.Result?.trim() ?? ''] ?? null,
  };
}

function playerOf(
  name: string | undefined,
  elo: string | undefined,
): ImportedPlayer {
  const trimmed = name?.trim();
  const rating = elo?.trim();
  return {
    name: trimmed && trimmed !== '?' ? trimmed : null,
    rating: rating && /^\d+$/.test(rating) ? Number(rating) : null,
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

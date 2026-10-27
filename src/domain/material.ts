import { Color, PieceSymbol } from 'chess.js';

const PIECE_VALUES: Record<Exclude<PieceSymbol, 'k'>, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

// Most valuable first, the order the pieces are shown in.
const PIECE_ORDER = Object.keys(PIECE_VALUES) as Exclude<PieceSymbol, 'k'>[];

export type SideMaterial = {
  /** Pieces this side has more of than the other, most valuable first. */
  pieces: PieceSymbol[];
  /** How far ahead this side is in material; 0 unless it's ahead. */
  score: number;
};

export type MaterialImbalance = Record<Color, SideMaterial>;

function countPieces(fen: string): Record<Color, Record<PieceSymbol, number>> {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const char of fen.split(' ')[0]) {
    const type = char.toLowerCase() as PieceSymbol;
    if (!(type in counts.w)) continue;
    counts[char === type ? 'b' : 'w'][type] += 1;
  }
  return counts;
}

/** What each side has captured, net of the other's captures, as lichess
 * shows it beside the players' names. */
export function materialImbalance(fen: string): MaterialImbalance {
  const counts = countPieces(fen);
  const imbalance: MaterialImbalance = {
    w: { pieces: [], score: 0 },
    b: { pieces: [], score: 0 },
  };
  let whiteLead = 0;
  for (const type of PIECE_ORDER) {
    const diff = counts.w[type] - counts.b[type];
    whiteLead += diff * PIECE_VALUES[type];
    const ahead = diff > 0 ? imbalance.w : imbalance.b;
    for (let i = 0; i < Math.abs(diff); i++) ahead.pieces.push(type);
  }
  if (whiteLead > 0) imbalance.w.score = whiteLead;
  if (whiteLead < 0) imbalance.b.score = -whiteLead;
  return imbalance;
}

import { Chess, Color } from 'chess.js';

import { otherColor } from './players';
import { RawScore } from './uci';

// A score as analysis shows it: from white's point of view, as on lichess and
// chess.com - plus is good for white - or a mate, and for whom.
export type EngineScore =
  { kind: 'cp'; cp: number } | { kind: 'mate'; moves: number; winner: Color };

// The engine scores for the side to move; turn that round for white.
export function toWhitePov(raw: RawScore, turn: Color): EngineScore {
  if (raw.kind === 'cp') {
    return { kind: 'cp', cp: turn === 'w' ? raw.value : -raw.value };
  }
  return {
    kind: 'mate',
    moves: Math.abs(raw.value),
    winner: raw.value > 0 ? turn : otherColor(turn),
  };
}

// "+0.3", "-1.2", "0.0"; "#3" for white mating, "-#3" for black - and
// the result, "1-0" or "0-1", once it's mate.
export function formatScore(score: EngineScore): string {
  if (score.kind === 'mate') {
    if (score.moves === 0) return score.winner === 'w' ? '1-0' : '0-1';
    return `${score.winner === 'w' ? '' : '-'}#${score.moves}`;
  }
  // In pawns, to one decimal place.
  // Rounded away from 0 alike for either side.
  const tenths = Math.sign(score.cp) * Math.round(Math.abs(score.cp) / 10);
  if (tenths === 0) return '0.0';
  return `${tenths > 0 ? '+' : '-'}${(Math.abs(tenths) / 10).toFixed(1)}`;
}

// How much of the eval bar is white's, 0 to 1: lichess's winning-chances
// curve, so a pawn up in a level game shows plainly and a rook up doesn't
// fill the bar - a mate does.
export function evalBarFraction(score: EngineScore): number {
  if (score.kind === 'mate') return score.winner === 'w' ? 1 : 0;
  const cp = Math.max(-1000, Math.min(1000, score.cp));
  const chances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return (chances + 1) / 2;
}

// A position with no moves left has no search to run, just a result: mate
// for the side that gave it, or level for a stalemate or a draw. Null while
// the game goes on.
export function finalScore(fen: string): EngineScore | null {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) {
    return { kind: 'mate', moves: 0, winner: otherColor(chess.turn()) };
  }
  if (chess.isGameOver()) return { kind: 'cp', cp: 0 };
  return null;
}

// A line of engine moves as SAN, from the position it starts at - as far as
// `max` moves, and as far as they're legal.
export function pvToSan(
  fen: string,
  pv: string[],
  max = pv.length,
  cache?: SanCache,
): string[] {
  let chess: Chess | null = null;
  let at = fen;
  const sans: string[] = [];
  for (const uci of pv.slice(0, max)) {
    const key = `${at}|${uci}`;
    const known = cache?.get(key);
    if (known) {
      sans.push(known.san);
      at = known.after;
      continue;
    }
    // Only played out from where the cache leaves off.
    if (!chess || chess.fen() !== at) chess = new Chess(at);
    try {
      const { san, after } = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
      cache?.set(key, { san, after });
      sans.push(san);
      at = after;
    } catch {
      break;
    }
  }
  return sans;
}

// Moves already written as SAN, by the position they're played from - an
// engine's next update mostly repeats its last one's lines, so playing them
// out again through chess.js, the costly part, is mostly skipped.
export type SanCache = Map<string, { san: string; after: string }>;

// A move of a line as it reads: its SAN, after its number - "4." before
// white's moves, and "4..." before the first, when it's black's.
export type NumberedMove = { label: string | null; san: string };

// A line of SAN moves numbered from the position it starts at.
export function numberMoves(fen: string, sans: string[]): NumberedMove[] {
  const [, turn, , , , fullmove] = fen.split(' ');
  let number = Number(fullmove) || 1;
  let white = turn !== 'b';
  return sans.map((san, index) => {
    const label = white ? `${number}.` : index === 0 ? `${number}...` : null;
    if (!white) number += 1;
    white = !white;
    return { label, san };
  });
}

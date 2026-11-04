import OPENINGS from './openings.json';

// Lichess's opening names (CC0), keyed by the position an opening reaches -
// built by scripts/build-openings.js.
const BY_POSITION = OPENINGS as unknown as Record<
  string,
  [eco: string, name: string]
>;

export type Opening = { eco: string; name: string };

// A position as an opening book keys it: where the pieces are, whose move,
// castling and en passant - not the move counters, so a transposition finds
// the same name.
export function epd(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

// The opening a line of play is in: the last of its positions with a name,
// so the name stays once the moves leave the book.
export function openingAt(fens: string[]): Opening | null {
  for (let i = fens.length - 1; i >= 0; i--) {
    const found = BY_POSITION[epd(fens[i])];
    if (found) return { eco: found[0], name: found[1] };
  }
  return null;
}

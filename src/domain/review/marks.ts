import { Color } from 'chess.js';

import type { MoveClass, ReviewedMove } from './types';

// The cchess review's marks: chess's own annotation symbols, put only on
// the moves that matter, as an annotated game does - a best, good, book or
// forced move goes unmarked, said in words alone.
export const MARK_GLYPHS = ['!!', '!', '?!', '?', '??'] as const;

export type MarkGlyph = (typeof MARK_GLYPHS)[number];

export type Mark = { glyph: MarkGlyph; name: string };

const MARKS: Partial<Record<MoveClass, Mark>> = {
  brilliant: { glyph: '!!', name: 'Brilliant' },
  great: { glyph: '!', name: 'Strong' },
  inaccuracy: { glyph: '?!', name: 'Dubious' },
  mistake: { glyph: '?', name: 'Mistake' },
  // A winning chance let go is a mistake too - the words say what was
  // missed.
  miss: { glyph: '?', name: 'Mistake' },
  blunder: { glyph: '??', name: 'Blunder' },
};

// A class's mark, or null for one left unmarked.
export function markOf(moveClass: MoveClass): Mark | null {
  return MARKS[moveClass] ?? null;
}

// The class whose color a mark is drawn in - a miss counts as a mistake.
export const MARK_CLASSES: Record<MarkGlyph, MoveClass> = {
  '!!': 'brilliant',
  '!': 'great',
  '?!': 'inaccuracy',
  '?': 'mistake',
  '??': 'blunder',
};

// What a move was, in plain words, for every class.
const WORDS: Record<MoveClass, string> = {
  brilliant: 'Brilliant move',
  great: 'Strong move',
  best: 'Best move',
  excellent: 'Good move',
  good: 'Good move',
  book: 'Book move',
  forced: 'Only move',
  inaccuracy: 'Dubious move',
  mistake: 'Mistake',
  miss: 'Missed chance',
  blunder: 'Blunder',
};

export function wordOf(moveClass: MoveClass): string {
  return WORDS[moveClass];
}

// A side's marked moves, by mark.
export function markCounts(
  moves: ReviewedMove[],
  color: Color,
): Record<MarkGlyph, number> {
  const counts = Object.fromEntries(MARK_GLYPHS.map((g) => [g, 0])) as Record<
    MarkGlyph,
    number
  >;
  for (const move of moves) {
    const mark = move.color === color ? markOf(move.moveClass) : null;
    if (mark) counts[mark.glyph] += 1;
  }
  return counts;
}

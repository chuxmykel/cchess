import { Color } from 'chess.js';

import { materialBalance, PIECE_VALUE } from './motifs';
import { THEME_WORDS } from './phrases';
import {
  ENDGAME_MATERIAL,
  OPENING_PLIES_AFTER_BOOK,
  STRATEGY_SLIPS,
} from './thresholds';
import {
  type GameReview,
  isSlip,
  type MoveFact,
  type ReviewedMove,
  type ThemeCard,
} from './types';

// What a review closes on: a few things to take from the game, for the side
// reviewed - where it went wrong (the opening, tactics, the quieter moves of
// strategy, the endgame), or that it went well.

const TACTICAL: MoveFact['kind'][] = [
  'allowsMate',
  'missesMate',
  'hangs',
  'allowsFork',
  'allowsPin',
  'trapped',
  'losesMaterial',
  'missesWin',
];

// Little left on the board: no queens, or not much besides.
function isEndgame(fen: string): boolean {
  let pieces = 0;
  let queens = 0;
  for (const char of fen.split(' ')[0]) {
    const type = char.toLowerCase();
    if (type === 'q') queens += 1;
    if (type === 'n' || type === 'b' || type === 'r' || type === 'q') {
      pieces += PIECE_VALUE[type];
    }
  }
  return (
    pieces <=
    (queens === 0
      ? ENDGAME_MATERIAL.withoutQueens
      : ENDGAME_MATERIAL.withQueens)
  );
}

// The opening: the book, and the ten moves either side makes after it.
function isOpening(moves: ReviewedMove[], index: number): boolean {
  const lastBook = moves.findLastIndex((m) => m.moveClass === 'book');
  return index <= Math.max(lastBook, 0) + OPENING_PLIES_AFTER_BOOK;
}

export function themeCards(review: GameReview, side: Color): ThemeCard[] {
  const mine = review.moves
    .map((move, index) => ({ move, index }))
    .filter(({ move }) => move.color === side);
  const slips = mine.filter(({ move }) => isSlip(move.moveClass));
  const cards: ThemeCard[] = [];

  const openingSlips = slips.filter(({ index }) =>
    isOpening(review.moves, index),
  );
  if (openingSlips.length > 0) {
    cards.push({
      theme: 'opening',
      title: THEME_WORDS.opening.title,
      text:
        openingSlips.length > 1
          ? THEME_WORDS.opening.slips
          : THEME_WORDS.opening.oneSlip,
    });
  } else if (mine.length > 0) {
    cards.push({
      theme: 'opening',
      title: THEME_WORDS.opening.title,
      text: THEME_WORDS.opening.clean,
    });
  }

  const tactical = slips.flatMap(({ move }) =>
    move.facts.filter((fact) => TACTICAL.includes(fact.kind)),
  );
  if (tactical.length > 0) {
    const counts = new Map<MoveFact['kind'], number>();
    for (const fact of tactical) {
      counts.set(fact.kind, (counts.get(fact.kind) ?? 0) + 1);
    }
    const [commonest] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    cards.push({
      theme: 'tactics',
      title: THEME_WORDS.tactics.title,
      text: THEME_WORDS.tactics.text.replace(
        '{cause}',
        THEME_WORDS.tactics.causes[commonest] ?? 'tactics',
      ),
    });
  }

  const quiet = slips.filter(
    ({ move }) =>
      !move.facts.some((fact) => TACTICAL.includes(fact.kind)) &&
      !isEndgame(move.fenBefore),
  );
  if (quiet.length >= STRATEGY_SLIPS) {
    cards.push({
      theme: 'strategy',
      title: THEME_WORDS.strategy.title,
      text: THEME_WORDS.strategy.text,
    });
  }

  const endgameSlips = slips.filter(({ move }) => isEndgame(move.fenBefore));
  if (endgameSlips.length > 0) {
    const ahead = materialBalance(endgameSlips[0].move.fenBefore, side) > 0;
    cards.push({
      theme: 'endgame',
      title: THEME_WORDS.endgame.title,
      text: ahead ? THEME_WORDS.endgame.ahead : THEME_WORDS.endgame.behind,
    });
  }

  return cards.slice(0, 3);
}

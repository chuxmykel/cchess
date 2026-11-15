import { Color } from 'chess.js';

import { materialBalance, PIECE_VALUE } from './motifs';
import type { GameReview, MoveFact, ReviewedMove, ThemeCard } from './types';

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

const TACTIC_NAMES: Partial<Record<MoveFact['kind'], string>> = {
  hangs: 'pieces left hanging',
  allowsFork: 'forks',
  allowsPin: 'pins',
  trapped: 'pieces getting trapped',
  allowsMate: 'mating attacks',
  missesMate: 'mates you could have given',
  missesWin: 'material you could have won',
  losesMaterial: 'material slipping away',
};

const SLIPS = ['inaccuracy', 'mistake', 'miss', 'blunder'];

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
  return queens === 0 ? pieces <= 26 : pieces <= 13;
}

// The opening: the book, and the ten moves either side makes after it.
function isOpening(moves: ReviewedMove[], index: number): boolean {
  const lastBook = moves.findLastIndex((m) => m.moveClass === 'book');
  return index <= Math.max(lastBook, 0) + 20;
}

export function themeCards(review: GameReview, side: Color): ThemeCard[] {
  const mine = review.moves
    .map((move, index) => ({ move, index }))
    .filter(({ move }) => move.color === side);
  const slips = mine.filter(({ move }) => SLIPS.includes(move.moveClass));
  const cards: ThemeCard[] = [];

  const openingSlips = slips.filter(({ index }) =>
    isOpening(review.moves, index),
  );
  if (openingSlips.length > 0) {
    cards.push({
      theme: 'opening',
      title: 'Opening',
      text:
        openingSlips.length > 1
          ? 'Mistakes in the opening held you back. Get your pieces out, castle, and fight for the center before going after anything.'
          : 'One slip in the opening cost you. Before each move there, check what your opponent is threatening.',
    });
  } else if (mine.length > 0) {
    cards.push({
      theme: 'opening',
      title: 'Opening',
      text: 'You came out of the opening without a slip. Keep playing it that way.',
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
      title: 'Tactics',
      text: `Most of what went wrong came down to ${TACTIC_NAMES[commonest]}. Before every move, look at what each of your pieces can be attacked by, and what the opponent's last move threatens.`,
    });
  }

  const quiet = slips.filter(
    ({ move }) =>
      !move.facts.some((fact) => TACTICAL.includes(fact.kind)) &&
      !isEndgame(move.fenBefore),
  );
  if (quiet.length >= 2) {
    cards.push({
      theme: 'strategy',
      title: 'Strategy',
      text: "When there isn't a tactic to play, find your piece doing the least and move it to a more active square.",
    });
  }

  const endgameSlips = slips.filter(({ move }) => isEndgame(move.fenBefore));
  if (endgameSlips.length > 0) {
    const ahead = materialBalance(endgameSlips[0].move.fenBefore, side) > 0;
    cards.push({
      theme: 'endgame',
      title: 'Endgame',
      text: ahead
        ? 'You had the endgame in hand and let some of it go. Activate your king and push your extra material home.'
        : 'The endgame is where it slipped. With fewer pieces, your king becomes a fighting piece - bring it in.',
    });
  }

  return cards.slice(0, 3);
}

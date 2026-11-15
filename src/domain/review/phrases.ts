import { sanToSpeech, textToSpeech } from './spokenText';
import type { MoveClass, MoveFact, ReviewComment } from './types';

// The words a review says, one table: for each fact a move can have, a few
// ways of saying it, filled in with the piece, the count and the opening.
// A word marked *like this* is an idea worth knowing - the bubble underlines
// it - and the marks are left out when it's read aloud.

type Fill = { piece?: string; n?: number; opening?: string | null };

const FACT_WORDS: Record<MoveFact['kind'], string[]> = {
  book: ['{opening}.', 'A well-known move here: {opening}.'],
  mates: ['Checkmate. Well played.', "And that's mate!"],
  forcesMate: ['This forces mate in {n}.', 'Mate in {n} is on the board now.'],
  allowsMate: [
    'That allows mate in {n}.',
    'This walks into a forced mate in {n}.',
  ],
  missesMate: [
    'You had a forced mate in {n} here.',
    'There was mate in {n} on the board.',
  ],
  hangs: [
    'You left your {piece} *hanging*.',
    'That leaves your {piece} *hanging*. Not a good look.',
  ],
  allowsFork: [
    "That lets the opponent's {piece} *fork* two of your pieces.",
    'Watch out: this allows a {piece} *fork*.',
  ],
  allowsPin: [
    'That allows a *pin* that costs you a {piece}.',
    'This runs into a *pin*, and the {piece} is lost.',
  ],
  trapped: [
    'You permitted the opponent to win a {piece} by eventually *trapping* it.',
    'Your {piece} ends up *trapped* after this.',
  ],
  losesMaterial: [
    'You permitted the opponent to win a {piece}.',
    'This loses a {piece}.',
  ],
  missesWin: [
    'You missed a chance to win a {piece}.',
    'There was a {piece} to be won here.',
  ],
  sacrifice: [
    'A clever *sacrifice*: the {piece} is given up for more.',
    'Giving up the {piece} - and it works.',
  ],
  fork: [
    'A *fork*: your {piece} hits two pieces at once.',
    'Your {piece} *forks* two pieces. Nicely done.',
  ],
  pin: [
    'That *pin* wins the {piece}.',
    'The {piece} is *pinned*, and it will fall.',
  ],
  winsMaterial: ['This wins a {piece}.', 'Picking up a {piece}. Nice.'],
  takesFree: [
    'Taking the free {piece}.',
    'The {piece} was there for the taking.',
  ],
  saves: [
    'Gotta protect your valuables. The {piece} gets to safety.',
    'Getting the {piece} out of danger. Solid move.',
  ],
  castles: [
    'Getting the king safe. Good plan.',
    'Castling: the king tucked away, a rook into play.',
  ],
  develops: [
    'Developing the {piece} toward the *center*.',
    'Another piece into play: the {piece} comes out.',
  ],
  centre: [
    'Staking a claim in the *center*.',
    'Taking control of the *center*. Not bad at all.',
  ],
  passedPawn: [
    'That pawn is *passed* now - only pieces can stop it.',
    'A *passed* pawn, and a real asset.',
  ],
  trades: [
    "Trading pieces when you're ahead. Simple and strong.",
    'Ahead in material, trading down is the way.',
  ],
  check: ['A useful check.', 'Check, keeping up the pressure.'],
  slips: [
    'That lets some of the advantage slip.',
    'There was a stronger move here.',
    'This gives the opponent an easier game.',
  ],
};

// When a move did nothing worth naming.
const CLASS_WORDS: Record<MoveClass, string[]> = {
  brilliant: ['A brilliant find.'],
  great: [
    'The only good move here, and you found it.',
    'A great move: anything else falls short.',
  ],
  best: ['The best move in the position.', 'Exactly what the engine wanted.'],
  excellent: ['One of the top moves here.', 'Very nearly the best.'],
  good: ['A reasonable move.', 'Solid, if not the very best.'],
  book: ['A well-known opening move.'],
  inaccuracy: FACT_WORDS.slips,
  mistake: FACT_WORDS.slips,
  miss: FACT_WORDS.slips,
  blunder: FACT_WORDS.slips,
};

const HEADLINES: Record<MoveClass, string> = {
  brilliant: 'is brilliant',
  great: 'is a great move',
  best: 'is best',
  excellent: 'is excellent',
  good: 'is good',
  book: 'is a book move',
  inaccuracy: 'is an inaccuracy',
  mistake: 'is a mistake',
  miss: 'is a miss',
  blunder: 'is a blunder',
};

// "Nf3 is a book move".
export function headline(san: string, moveClass: MoveClass): string {
  return `${san} ${HEADLINES[moveClass]}`;
}

// A number from a string, the same every time - for picking one of a few
// wordings, so the same review always reads the same.
export function seedOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function fill(template: string, values: Fill): string {
  return template
    .replace('{piece}', values.piece ?? 'piece')
    .replace('{n}', String(values.n ?? ''))
    .replace('{opening}', values.opening ?? '');
}

function wordingFor(fact: MoveFact, seed: number): string | null {
  if (fact.kind === 'book' && !fact.opening) return null;
  const options = FACT_WORDS[fact.kind];
  const values: Fill = {
    piece: 'piece' in fact ? fact.piece : undefined,
    n: 'moves' in fact ? fact.moves : undefined,
    opening: 'opening' in fact ? fact.opening : undefined,
  };
  return fill(options[seed % options.length], values);
}

// What the review says about a move: its first fact - the one most worth
// saying - and, for a slip with nothing more to say, the move that was
// better.
export function commentFor(
  move: { san: string; moveClass: MoveClass; bestSan: string | null },
  facts: MoveFact[],
  seed: number,
): ReviewComment {
  const first = facts[0];
  let text =
    (first && wordingFor(first, seed)) ??
    CLASS_WORDS[move.moveClass][seed % CLASS_WORDS[move.moveClass].length];
  let spokenText = text;
  if (first?.kind === 'slips' && move.bestSan) {
    text = `${text} ${move.bestSan} was best.`;
    spokenText = `${spokenText} ${sanToSpeech(move.bestSan)} was best.`;
  }
  const spokenHeadline = `${sanToSpeech(move.san)} ${HEADLINES[move.moveClass]}.`;
  return {
    text,
    spoken: `${spokenHeadline} ${textToSpeech(spokenText)}`,
  };
}

// The review's opening line.
export const INTRO =
  "Right, let's go through this game and find the key moments.";

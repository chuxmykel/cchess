import { sanToSpeech, textToSpeech } from './spokenText';
import type { MoveClass, MoveFact, ReviewComment } from './types';

// Everything a review says, in one place - none of it is stored: it's made
// afresh from the engine's evals each time a review is shown, so rewording
// anything here changes every review, old ones too.
//
// - A move's words: for each fact a move can have, a few ways of saying it,
//   filled in with the piece, the count and the opening.
// - The intro, chosen to fit the game; the chess facts shown while it's
//   analysed; Retry's lines; and the closing themes' advice.
//
// Where there are several wordings, a seed from the game picks one, so the
// same review always reads the same. A word marked *like this* is an idea
// worth knowing - the bubble underlines it - and the marks are left out
// when it's read aloud.

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

// What a review opens with depends on the game: how it went for the side
// reviewed, how cleanly it played, how long it was, its opening.
export type IntroContext = {
  // The game's outcome for the side reviewed - null when the viewer only
  // watched it.
  outcome: 'win' | 'loss' | 'draw' | null;
  white: string;
  black: string;
  opponent: string;
  opening: string | null;
  // Full moves played.
  moves: number;
  accuracy: number;
  // The side's mistakes, misses and blunders.
  slips: number;
};

const INTRO_WORDS = {
  any: [
    "Right, let's go through this game and find the key moments.",
    "Let's see what this game has to teach.",
  ],
  win: [
    "Nice win! Let's see how you got there.",
    "A win against {opponent}. Let's look at what worked - and what nearly didn't.",
  ],
  loss: [
    "A tough one. Let's find where it turned.",
    "Losses teach the most. Let's see where this one slipped away.",
  ],
  draw: [
    "Honours even. Let's see if either side could have pushed for more.",
    "A draw with {opponent}. Let's find the chances on both sides.",
  ],
  watched: [
    "Let's go through {white} against {black}.",
    "{white} against {black} - let's see the moments that decided it.",
  ],
  clean: [
    "Barely a slip in sight - {accuracy}% accuracy. Let's look at the highlights.",
  ],
  short: ["Short and sharp - {moves} moves. Let's look at each one."],
  long: [
    "A long one - {moves} moves. Let's go through the moments that mattered.",
  ],
  opening: ["{opening}. Let's see how it went from there."],
};

export function introLine(context: IntroContext, seed: number): string {
  const options =
    context.outcome === null
      ? [...INTRO_WORDS.watched]
      : context.slips === 0 && context.accuracy >= 85
        ? [...INTRO_WORDS.clean]
        : [...INTRO_WORDS[context.outcome], ...INTRO_WORDS.any];
  if (context.moves <= 15) options.push(...INTRO_WORDS.short);
  if (context.moves >= 60) options.push(...INTRO_WORDS.long);
  if (context.opening) options.push(...INTRO_WORDS.opening);
  return options[seed % options.length]
    .replace('{opponent}', context.opponent)
    .replace('{white}', context.white)
    .replace('{black}', context.black)
    .replace('{opening}', context.opening ?? '')
    .replace('{moves}', String(context.moves))
    .replace('{accuracy}', context.accuracy.toFixed(0));
}

// What a voice says when it's tried out in the settings.
export const VOICE_SAMPLE =
  "Right, let's go through this game. Knight f3 is best: another piece into play.";

// Shown, one after another, while a game's analysed.
export const ANALYSING_WORDS = [
  'There are more possible games of chess than atoms in the observable universe.',
  'After one move each, the board can already be in 400 different positions.',
  "The fewest moves to checkmate is two - the fool's mate.",
  'A knight on the edge of the board reaches four squares at most; in the middle, eight.',
  'A bishop stays on the color it starts on for the whole game.',
  'Pawns are the only pieces that never move backwards.',
  "'Checkmate' comes from the Persian shāh māt: the king is helpless.",
  'The engine is looking at thousands of positions a second, right here on your phone.',
  "En passant exists so a pawn can't slip past an enemy pawn with its two-square first move.",
  'The queen only became the strongest piece on the board in the late 1400s.',
];

// Retry: finding a better move where a slip was played.
export const RETRY_TITLE = 'Retry';

export function retryLine(
  side: 'White' | 'Black',
  tried: {
    san: string;
    verdict: 'checking' | 'right' | 'wrong';
    isPlayed: boolean;
  } | null,
): string {
  if (!tried) return `Find a better move for ${side}.`;
  switch (tried.verdict) {
    case 'checking':
      return `Let's see about ${tried.san}...`;
    case 'right':
      return `${tried.san} works. Well found!`;
    default:
      return tried.isPlayed
        ? "That's the move played. Try another."
        : `Not quite - ${tried.san} isn't it. Try again.`;
  }
}

// The closing themes' advice, by theme and what went wrong.
export const THEME_WORDS = {
  opening: {
    title: 'Opening',
    clean:
      'You came out of the opening without a slip. Keep playing it that way.',
    oneSlip:
      'One slip in the opening cost you. Before each move there, check what your opponent is threatening.',
    slips:
      'Mistakes in the opening held you back. Get your pieces out, castle, and fight for the *center* before going after anything.',
  },
  tactics: {
    title: 'Tactics',
    // {cause}: what most of the slips came down to.
    text: "Most of what went wrong came down to {cause}. Before every move, look at what each of your pieces can be attacked by, and what the opponent's last move threatens.",
    causes: {
      hangs: 'pieces left *hanging*',
      allowsFork: '*forks*',
      allowsPin: '*pins*',
      trapped: 'pieces getting *trapped*',
      allowsMate: 'mating attacks',
      missesMate: 'mates you could have given',
      missesWin: 'material you could have won',
      losesMaterial: 'material slipping away',
    } as Partial<Record<MoveFact['kind'], string>>,
  },
  strategy: {
    title: 'Strategy',
    text: "When there isn't a tactic to play, find your piece doing the least and move it to a more active square.",
  },
  endgame: {
    title: 'Endgame',
    ahead:
      'You had the endgame in hand and let some of it go. Activate your king and push your extra material home.',
    behind:
      'The endgame is where it slipped. With fewer pieces, your king becomes a fighting piece - bring it in.',
  },
};

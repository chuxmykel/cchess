import type { EngineScore } from '../evalScore';
import { markOf, wordOf } from './marks';
import { sanToSpeech, textToSpeech } from './spokenText';
import { INTRO, STANDING } from './thresholds';
import type { MoveClass, MoveFact, ReviewComment, ReviewedMove } from './types';
import { winPercent } from './winChances';

// Everything a review says, in one place - none of it is stored: it's made
// afresh from the engine's evals each time a review is shown, so rewording
// anything here changes every review, old ones too.
//
// - A move's words: for each fact a move can have, a few ways of saying it,
//   filled in with the piece, the count and the opening.
// - The intro, chosen to fit the game; the chess facts shown while it's
//   analysed; Retry's lines; and the closing themes' advice.
// - The cchess review's own: its headlines, the decisive moment, the
//   chapters, the guesses and the clock.
//
// Where there are several wordings, a seed from the game picks one, so the
// same review always reads the same. A word marked *like this* is an idea
// worth knowing - the bubble underlines it - and the marks are left out
// when it's read aloud.

type Fill = { piece?: string; n?: number; opening?: string | null };

// It's people playing, so the words talk about the position and the
// player's choices - never what a machine "wanted" - and a slip's words
// don't give the better move away: Retry is there to find it.
const FACT_WORDS: Record<MoveFact['kind'], string[]> = {
  book: [
    '{opening}.',
    'A well-known move here: {opening}.',
    'Straight out of the book - {opening}.',
    '{opening}, played many thousands of times.',
  ],
  mates: [
    'Checkmate. Well played.',
    "And that's mate!",
    'Game over - a clean finish.',
    'Mate. Nothing left to say.',
  ],
  forcesMate: [
    'This forces mate in {n}.',
    'Mate in {n} is on the board now.',
    "From here it's mate in {n}, whatever the reply.",
    'The net is closing: mate in {n}.',
  ],
  allowsMate: [
    'That allows mate in {n}.',
    'This walks into a forced mate in {n}.',
    'Danger - the king can now be mated in {n}.',
    'This opens the door to a mate in {n}.',
  ],
  missesMate: [
    'You had a forced mate in {n} here.',
    'There was mate in {n} on the board.',
    'A mate in {n} slipped by. Can you spot it?',
    'The king was there for the taking - mate in {n}.',
  ],
  hangs: [
    'You left your {piece} *hanging*.',
    'That leaves your {piece} *hanging*. Not a good look.',
    'Your {piece} is left unprotected, and it can simply be taken.',
    'The {piece} has no defender now - it falls next move.',
    'Check what your opponent can take: the {piece} is *hanging*.',
  ],
  allowsFork: [
    "That lets the opponent's {piece} *fork* two of your pieces.",
    'Watch out: this allows a {piece} *fork*.',
    'This sets your pieces up for a {piece} *fork*.',
    'Two of your pieces can be hit at once by a {piece} *fork*.',
  ],
  allowsPin: [
    'That allows a *pin* that costs you a {piece}.',
    'This runs into a *pin*, and the {piece} is lost.',
    'Your {piece} gets caught in a *pin*.',
    "A *pin* is coming, and the {piece} can't escape it.",
  ],
  trapped: [
    'You permitted the opponent to win a {piece} by eventually *trapping* it.',
    'Your {piece} ends up *trapped* after this.',
    'The {piece} runs out of squares - it gets *trapped*.',
    "Nowhere left for the {piece} to go: it's *trapped*.",
  ],
  losesMaterial: [
    'You permitted the opponent to win a {piece}.',
    'This loses a {piece}.',
    'A {piece} goes down after this.',
    'This costs you a {piece} a few moves later.',
    "The {piece} can't be held after this.",
  ],
  missesWin: [
    'You missed a chance to win a {piece}.',
    'There was a {piece} to be won here.',
    'A {piece} was up for grabs. Can you see how?',
    'Your opponent left a {piece} to be won - this lets it go.',
  ],
  sacrifice: [
    'A clever *sacrifice*: the {piece} is given up for more.',
    'Giving up the {piece} - and it works.',
    'A bold *sacrifice* of the {piece}, and the position backs it up.',
    'The {piece} is offered, and taking it would be a mistake.',
  ],
  fork: [
    'A *fork*: your {piece} hits two pieces at once.',
    'Your {piece} *forks* two pieces. Nicely done.',
    'Two targets for one {piece} - a classic *fork*.',
    'The {piece} attacks two things at once, and only one can be saved.',
  ],
  pin: [
    'That *pin* wins the {piece}.',
    'The {piece} is *pinned*, and it will fall.',
    'A *pin*, and the {piece} behind it is in trouble.',
    "Pinning the {piece} - it can't get out of the way.",
  ],
  winsMaterial: [
    'This wins a {piece}.',
    'Picking up a {piece}. Nice.',
    'A {piece} up after this.',
    'This nets you a {piece}.',
  ],
  takesFree: [
    'Taking the free {piece}.',
    'The {piece} was there for the taking.',
    'An unprotected {piece} - thanks very much.',
    'Free material: the {piece} had no defender.',
  ],
  saves: [
    'Gotta protect your valuables. The {piece} gets to safety.',
    'Getting the {piece} out of danger. Solid move.',
    'The {piece} was under attack - good to tuck it away.',
    'Rescuing the {piece}. No need to give anything away.',
  ],
  castles: [
    'Getting the king safe. Good plan.',
    'Castling: the king tucked away, a rook into play.',
    'King safety first. Smart.',
    'Castled - the king is out of the middle.',
  ],
  develops: [
    'Developing the {piece} toward the *center*.',
    'Another piece into play: the {piece} comes out.',
    'The {piece} joins the game.',
    'Getting the {piece} off the back rank. Good development.',
  ],
  centre: [
    'Staking a claim in the *center*.',
    'Taking control of the *center*. Not bad at all.',
    'A pawn in the *center* - space and options.',
    'Fighting for the middle of the board.',
  ],
  passedPawn: [
    'That pawn is *passed* now - only pieces can stop it.',
    'A *passed* pawn, and a real asset.',
    "Nothing stands in this pawn's way: it's *passed*.",
    'A *passed* pawn to push - keep an eye on it.',
  ],
  trades: [
    "Trading pieces when you're ahead. Simple and strong.",
    'Ahead in material, trading down is the way.',
    'Each trade brings your extra material closer to counting.',
    'Swapping pieces off while ahead. Textbook.',
  ],
  check: [
    'A useful check.',
    'Check, keeping up the pressure.',
    'Check - and the king has to answer.',
    'Keeping the king busy with a check.',
  ],
  slips: [],
};

// A slip with no tactic to name: how bad, in its own words.
const SLIP_WORDS: Record<
  'inaccuracy' | 'mistake' | 'miss' | 'blunder',
  string[]
> = {
  inaccuracy: [
    'That lets some of the advantage slip.',
    'A little loose - there was something more precise.',
    'Playable, but not the sharpest choice.',
    'This gives a bit of ground away.',
    'Not bad, but you could have asked more of the position.',
    'This gives the opponent an easier game.',
  ],
  mistake: [
    'This one hurts - there was a much better move.',
    'A real slip. The position deserved more.',
    'That gives away a good part of your position.',
    'Careful - this changes the picture.',
    'Not this one. Take another look at the position.',
    'Things get harder from here.',
  ],
  miss: [
    'Your opponent slipped, and this lets them off the hook.',
    'A chance to punish the last move went by.',
    'The last move left an opening. This walks past it.',
    "There was more to take from the opponent's mistake.",
  ],
  blunder: [
    'Ouch. This turns the game.',
    'A big one - this throws a lot away.',
    "That's a serious blunder.",
    'This changes everything, and not in your favor.',
    'One move, and the game swings.',
  ],
};

// A nudge toward the better move, without giving it away: the piece that
// had it.
const HINT_WORDS = [
  'Look at what your {piece} could do.',
  'Your {piece} had a stronger idea.',
  "Hint: it's a {piece} move.",
  'Try a {piece} move - tap Retry.',
  'The answer starts with your {piece}.',
];

// When a move did nothing worth naming.
const CLASS_WORDS: Record<MoveClass, string[]> = {
  brilliant: [
    'A brilliant find.',
    'Brilliant - few players would even consider it.',
    'A move to remember. Brilliant.',
  ],
  great: [
    'The only good move here, and you found it.',
    'A great move: anything else falls short.',
    'Under pressure, the one move that holds. Great.',
    'Found it - nothing else works as well.',
  ],
  best: [
    'The best move in the position.',
    'Spot on.',
    'Exactly right.',
    "That's the move.",
    'Precise - nothing better here.',
    "Couldn't ask for more.",
    'Top move. Well played.',
  ],
  excellent: [
    'One of the top moves here.',
    'Very nearly the best.',
    'Excellent - right up there with the best.',
    'A strong, accurate move.',
    'Hard to improve on this.',
  ],
  good: [
    'A reasonable move.',
    'Solid, if not the very best.',
    'A sensible choice.',
    'Fine - it keeps things together.',
    'Good enough to keep the balance.',
  ],
  book: [
    'A well-known opening move.',
    'Still in the opening book.',
    'Theory - many have played this before.',
  ],
  forced: [
    'The only legal move.',
    "No choice here: it's the one move there is.",
    'Forced - nothing else was possible.',
  ],
  inaccuracy: SLIP_WORDS.inaccuracy,
  mistake: SLIP_WORDS.mistake,
  miss: SLIP_WORDS.miss,
  blunder: SLIP_WORDS.blunder,
};

const HEADLINES: Record<MoveClass, string> = {
  brilliant: 'is brilliant',
  great: 'is a great move',
  best: 'is best',
  excellent: 'is excellent',
  good: 'is good',
  book: 'is a book move',
  forced: 'is forced',
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

// One of a few wordings, by the seed.
function pick(options: string[], seed: number): string {
  return options[seed % options.length];
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
  if (options.length === 0) return null;
  const values: Fill = {
    piece: 'piece' in fact ? fact.piece : undefined,
    n: 'moves' in fact ? fact.moves : undefined,
    opening: 'opening' in fact ? fact.opening : undefined,
  };
  return fill(pick(options, seed), values);
}

// What the review says about a move: its first fact - the one most worth
// saying - or else what its class says; and, for a slip with no tactic to
// name, a hint at the piece that had the better move.
export function commentFor(
  move: { san: string; moveClass: MoveClass; bestPiece: string | null },
  facts: MoveFact[],
  seed: number,
): ReviewComment {
  const first = facts[0];
  let text =
    (first && wordingFor(first, seed)) ??
    pick(CLASS_WORDS[move.moveClass], seed);
  if (first?.kind === 'slips' && move.bestPiece) {
    // Picked apart from the words before it, so they don't always pair.
    text = `${text} ${fill(pick(HINT_WORDS, Math.floor(seed / 7)), { piece: move.bestPiece })}`;
  }
  const spokenHeadline = `${sanToSpeech(move.san)} ${HEADLINES[move.moveClass]}.`;
  return {
    text,
    spoken: `${spokenHeadline} ${textToSpeech(text)}`,
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
      : context.slips === 0 && context.accuracy >= INTRO.cleanAccuracy
        ? [...INTRO_WORDS.clean]
        : [...INTRO_WORDS[context.outcome], ...INTRO_WORDS.any];
  if (context.moves <= INTRO.shortGame) options.push(...INTRO_WORDS.short);
  if (context.moves >= INTRO.longGame) options.push(...INTRO_WORDS.long);
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
  'Every position of this game is being looked at right here, on your phone.',
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

// The cchess review's words.

// The players' names, by color.
export type Names = { w: string; b: string };

// Where a side stands.
export type Standing = 'losing' | 'level' | 'winning';

// A move with its mark, if it has one: "Nxe5??".
export function markedSan(move: { san: string; moveClass: MoveClass }): string {
  return `${move.san}${markOf(move.moveClass)?.glyph ?? ''}`;
}

// "Nxe5?? · Blunder", "Nf3 · Best move".
export function cchessHeadline(san: string, moveClass: MoveClass): string {
  return `${markedSan({ san, moveClass })} · ${wordOf(moveClass)}`;
}

// What's read aloud for a move: its words, then the comment.
export function cchessSpoken(
  san: string,
  moveClass: MoveClass,
  text: string,
): string {
  return `${sanToSpeech(san)}: ${wordOf(moveClass).toLowerCase()}. ${textToSpeech(text)}`;
}

// The game as it stands after a score, said of whoever's ahead.
function standingNow(score: EngineScore, names: Names): string {
  const white = winPercent(score, 'w');
  if (white >= STANDING.winning) return `${names.w} is winning`;
  if (white < STANDING.losing) return `${names.b} is winning`;
  return 'the game is level';
}

function standingThen(score: EngineScore, names: Names): string {
  const white = winPercent(score, 'w');
  if (white >= STANDING.winning) return `${names.w} was winning`;
  if (white < STANDING.losing) return `${names.b} was winning`;
  return 'the game was level';
}

const moveNumberOf = (ply: number) => Math.ceil(ply / 2);

export function resultLine(
  result: 'white' | 'black' | 'draw' | null,
  names: Names,
): string {
  if (result === 'white') return `${names.w} won.`;
  if (result === 'black') return `${names.b} won.`;
  if (result === 'draw') return 'A draw.';
  return 'That was the game.';
}

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);

// A chapter's title and what it says: how it ended, and for a turning
// point, who turned it and how.
export function chapterText(
  kind: 'opening' | 'turn' | 'middlegame' | 'endgame' | 'finish',
  moves: ReviewedMove[],
  start: number,
  end: number,
  context: {
    names: Names;
    result: 'white' | 'black' | 'draw' | null;
    opening: string | null;
  },
): { title: string; text: string } {
  const { names, result, opening } = context;
  const after = moves[end].scoreAfter;
  switch (kind) {
    case 'opening':
      return {
        title: 'The opening',
        text: `${opening ? `${opening}. ` : ''}Out of the opening, ${standingNow(after, names)}.`,
      };
    case 'turn': {
      const move = moves[end];
      const then = standingThen(move.scoreBefore, names);
      const now = standingNow(after, names);
      const played = `${names[move.color]} played ${markedSan(move)}`;
      return {
        title: `Move ${moveNumberOf(move.ply)}`,
        text:
          then.replace('was', 'is') === now
            ? `${played}, the biggest swing of this stretch.`
            : `${played}: ${then}; now ${now}.`,
      };
    }
    case 'middlegame':
      return {
        title: 'The middlegame',
        text: `${capitalise(standingNow(after, names))} by its end.`,
      };
    case 'endgame':
      return {
        title: 'The endgame',
        text: `${capitalise(standingNow(after, names))} at the finish. ${resultLine(result, names)}`,
      };
    default:
      return { title: 'The finish', text: resultLine(result, names) };
  }
}

// What the decisive-moment card says.
export function decisiveLine(
  of:
    | { move: ReviewedMove; before: Standing; after: Standing }
    | { closest: ReviewedMove }
    | null,
  names: Names,
): string {
  if (!of) return 'There were no moves to speak of.';
  if ('closest' in of) {
    return `No single move decided it - the closest was ${markedSan(of.closest)}.`;
  }
  const { move, before, after } = of;
  return before === after
    ? `${markedSan(move)} was the game's biggest swing.`
    : `${markedSan(move)} took ${names[move.color]} from ${before} to ${after}.`;
}

// At a slip, the opponent's idea: the reply that punished it.
export function theirIdea(san: string): string {
  return `Their idea: ${san}.`;
}

// Guessing at a turning point, before it's revealed.
export const GUESS_TITLE = 'Your move';

export function guessPrompt(ply: number, name: string): string {
  return `Move ${moveNumberOf(ply)} for ${name}: what would you play?`;
}

export function guessLine(tried: {
  san: string;
  verdict: 'checking' | 'right' | 'wrong';
  isPlayed: boolean;
}): string {
  switch (tried.verdict) {
    case 'checking':
      return `Let's see about ${tried.san}...`;
    case 'right':
      return tried.isPlayed
        ? `${tried.san} - just as played. Well found!`
        : `${tried.san} works. Well found!`;
    default:
      return tried.isPlayed
        ? "That's the move played, and it's where it went wrong. Try another, or reveal it."
        : `Not quite - ${tried.san} isn't it. Try again, or reveal the move.`;
  }
}

// A guess found that was hard to find.
export function foundHardLine(difficulty: 'only' | 'hard'): string {
  return difficulty === 'only'
    ? 'That was the only move - nothing else held.'
    : "That one wasn't easy to see.";
}

// The closing card on the guesses.
export function guessTally(found: number, asked: number): string {
  if (found === asked) {
    return asked === 1
      ? 'You found the turning point. Well played.'
      : `You found all ${asked} turning points. Well played.`;
  }
  return `You found ${found} of ${asked} turning points. The ones you missed are worth another look.`;
}

// Time spent on a move: "4.2s", "12s", "1m 30s".
export function formatSpent(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) return `${Math.round(seconds * 10) / 10}s`;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const whole = Math.round(seconds);
  const rest = whole % 60;
  return `${Math.floor(whole / 60)}m${rest ? ` ${rest}s` : ''}`;
}

// What the clock says about a side: its longest think, a slip played in a
// hurry, and how its play held up as its time ran down - said to the side
// reviewed, or of it by name (`name`) when the viewer didn't play it.
export function timeLines(
  report: {
    longest: { move: ReviewedMove; ms: number } | null;
    hastySlip: { move: ReviewedMove; ms: number } | null;
    lowTime: { plenty: number; short: number } | null;
  },
  name: string | null = null,
): string[] {
  const lines: string[] = [];
  if (report.longest) {
    const { move, ms } = report.longest;
    const whose = name ? `${name}'s` : 'Your';
    lines.push(
      `${whose} longest think: ${formatSpent(ms)} on ${markedSan(move)}, ${wordOf(move.moveClass).toLowerCase()}.`,
    );
  }
  if (report.hastySlip) {
    const { move, ms } = report.hastySlip;
    lines.push(
      `${markedSan(move)} came in ${formatSpent(ms)} - a moment longer might have saved it.`,
    );
  }
  if (report.lowTime) {
    const { plenty, short } = report.lowTime;
    lines.push(
      `Accuracy ${Math.round(plenty)}% with time to spare, ${Math.round(short)}% when it ran short.`,
    );
  }
  return lines;
}

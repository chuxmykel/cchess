// Every value a game review judges by, in one place to tune: the classes'
// bars, how far the engine's lines are followed, what's worth saying, and
// where a game's phases begin. Winning chances are a side's, 0 to 100 (see
// winChances); material is in pawns (motifs' PIECE_VALUE).

// Classes (classifyMove)

// How much of the mover's winning chances a move gives away: 2, 5, 10 and
// 20 points marking excellent, good, inaccuracy and mistake from blunder.
export const CLASS_THRESHOLDS = {
  excellent: 2,
  good: 5,
  inaccuracy: 10,
  mistake: 20,
} as const;

// Another move than the engine's, giving away less than this, is best too.
export const BEST_WITHIN = 0.5;

// The only good move: the next best keeps this much less.
export const ONLY_MOVE_GAP = 15;

// A best move hard to find (difficulty.ts): the next best keeps this much
// less - short of an only move.
export const HARD_FIND_GAP = 7;

// Where a side stands: losing under the first, winning from the second,
// level between.
export const STANDING = { losing: 35, winning: 65 } as const;

// Completely winning: from here, what's given away hardly matters.
export const COMPLETELY_WINNING = 80;

// Brilliant: a sound sacrifice that's also the only good move - great's
// test, at the gap for strong players whatever the rating - and leaves the
// mover no worse than this, "not in a bad position": level or a little
// worse. What "!!" means in an annotated game, and as rare: about one move
// in 1,500.
export const BRILLIANT_AT_LEAST = 45;

// Great is more generous to newer players. From a rating
// of `until` it's judged as above; from `fully` down, the only good move
// needs a gap of 10, not 15. Between the two, in a straight line.
export const GENEROUS = {
  until: 2000,
  fully: 1000,
  onlyMoveGap: 10,
} as const;

// A player with no rating - a guest, a pasted game without Elo - is taken as
// a new one is rated: the server's starting rating (Glicko-2, lichess's
// scale).
export const UNRATED = 1500;

// Winning chances barely move once a game is all but lost, so a piece thrown
// away there would read as a good move: a move giving up this much material
// over best play - and this much of the score - is a mistake whatever the
// chances. Not while the mover is still completely winning after it.
export const MATERIAL_MISTAKE = { pawns: 3, centipawns: 80 } as const;

// Material along the engine's lines (motifs)

// How deep into a line material is counted - far enough for an exchange to
// finish, not so far the engine's guesses count.
export const LINE_PLIES = 10;

// How far into the answer to a sacrifice its material is followed: the
// opponent's first three moves, long enough to see a trade come back.
export const SACRIFICE_PLIES = 6;
// Down this much, and not won straight back: a piece for a pawn, or the
// exchange.
export const SACRIFICE_PAWNS = 2;

export const MATERIAL = {
  // A piece - a knight or bishop and up - as against a pawn: what a skewer
  // wins, a free piece taken, or one lost further along the line that
  // counts as hung.
  piece: 3,
  // Won or lost over the line, as best play would have it, to be worth
  // saying: more than a pawn.
  worthSaying: 2,
  // Ahead by this much, trading pieces is a plan worth naming.
  aheadToTrade: 2,
  // A piece taken and this much less won straight back is a trade: a knight
  // for a bishop, or a rook for a minor piece and a pawn.
  tradeWithin: 1,
} as const;

// What's worth saying of a good move, by its ply (1 for white's first move):
// developing and the centre only in the opening; a passed pawn only once
// it's more than the structure the opening left.
export const FACTS_BY_PLY = { openingUntil: 24, passedPawnFrom: 21 } as const;

// The closing cards and the intro (themes, phrases)

// Little left on the board: the knights, bishops, rooks and queens of both
// sides together worth no more than this, with the queens off or on.
export const ENDGAME_MATERIAL = { withoutQueens: 26, withQueens: 13 } as const;

// The opening: the book, and the ten moves either side makes after it.
export const OPENING_PLIES_AFTER_BOOK = 20;

// Strategy is a closing card once this many slips came with no tactic.
export const STRATEGY_SLIPS = 2;

export const INTRO = {
  // A clean game: no mistake, miss or blunder, and this accurate.
  cleanAccuracy: 85,
  // Full moves, at most, for a short game, and at least for a long one.
  shortGame: 15,
  longGame: 60,
} as const;

// The cchess review's story (story.ts): a turning point gives away this
// much of the mover's winning chances - a mistake's - and the game's told
// around at most this many, this many moves apart at least.
export const TURNING_POINT = { loss: 10, most: 3, apart: 3 } as const;

// The cchess review's clock (time.ts): a slip played this fast is called
// out; and a side's accuracy is compared with less than this share of its
// starting time left against more, once it's made this many moves either
// side of the line.
export const TIME = {
  hastySlipMs: 10_000,
  lowTimeShare: 0.25,
  lowTimeMoves: 3,
} as const;

// The momentum rope's replay: about this long in all, each move shown for
// between these, a turning point held a moment longer so it registers; and
// how far white's winning chances (-1 to 1) lean before a side is said to
// be better, then winning.
export const MOMENTUM = {
  replayMs: 8000,
  minStepMs: 120,
  maxStepMs: 600,
  turnHoldMs: 1000,
  betterFrom: 0.2,
  winningFrom: 0.5,
} as const;

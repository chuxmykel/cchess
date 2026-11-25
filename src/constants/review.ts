import type { SearchLimit } from '../engine/types';

// How hard the engine looks at each position of a game under review: deeper
// is surer, and slower - a game of 40 moves takes about 10s, 20s or a minute
// on a recent phone.
export type ReviewStrength = 'fast' | 'standard' | 'deep';

export const REVIEW_STRENGTHS: readonly ReviewStrength[] = [
  'fast',
  'standard',
  'deep',
];

export const REVIEW_STRENGTH_LABELS: Record<ReviewStrength, string> = {
  fast: 'Fast',
  standard: 'Standard',
  deep: 'Deep',
};

// Each position searched to this depth, but for no longer than this - a
// sharp position can take a depth far longer to reach.
export const REVIEW_SEARCH: Record<ReviewStrength, SearchLimit> = {
  fast: { depth: 11, movetimeMs: 600 },
  standard: { depth: 14, movetimeMs: 1500 },
  deep: { depth: 18, movetimeMs: 4000 },
};

// The best line and the next best, for whether the best was the only good
// move.
export const REVIEW_MULTI_PV = 2;

// A position's best line, kept as far as this - enough to show, and to
// read material won or lost along it.
export const REVIEW_LINE_MOVES = 12;

// Whose moves the review stops at: yours, in a game you played - or a side.
export type ReviewAs = 'me' | 'white' | 'black';

export const REVIEW_AS_LABELS: Record<ReviewAs, string> = {
  me: 'Myself',
  white: 'White',
  black: 'Black',
};

// How the review is told: cchess's own - chess's marks only where they
// matter, the game in turning-point chapters with a guess at each, the
// decisive moment and the clock - or the classic coach, a class for every
// move.
export type ReviewStyle = 'cchess' | 'classic';

export const REVIEW_STYLES: readonly ReviewStyle[] = ['cchess', 'classic'];

export const REVIEW_STYLE_LABELS: Record<ReviewStyle, string> = {
  cchess: 'cchess',
  classic: 'Classic',
};

export const REVIEW_STYLE_HINTS: Record<ReviewStyle, string> = {
  cchess:
    'The game in chapters, a guess at each turning point, the clock and the move that decided it.',
  classic: 'Every move graded, stepping from one key moment to the next.',
};

// The review's settings, kept on the device.
export type ReviewSettings = {
  style: ReviewStyle;
  // Each comment read aloud, in this voice - null for the best English
  // voice on the device.
  voice: boolean;
  voiceId: string | null;
  // The best move's arrow shown on every move, without asking.
  showBestMoves: boolean;
  evalBar: boolean;
  reviewAs: ReviewAs;
  strength: ReviewStrength;
};

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  style: 'cchess',
  voice: true,
  voiceId: null,
  showBestMoves: false,
  evalBar: true,
  reviewAs: 'me',
  strength: 'standard',
};

// Next plays the moves on to the next key moment, one this often - quick,
// but each one seen.
export const REVIEW_PLAY_STEP_MS = 170;

// Show plays out the line from a move, one move this often - slower, to
// follow what it does - this many moves of it.
export const REVIEW_LINE_STEP_MS = 650;
export const REVIEW_LINE_SHOWN = 8;

// While a game's analysed, a new chess fact this often.
export const REVIEW_FACT_MS = 6000;

// A comment's voice, a little quicker than speech's own default.
export const REVIEW_SPEECH_RATE = 1.05;

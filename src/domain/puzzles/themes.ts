import type { MoveFact } from '../review/types';

// Lichess's puzzle themes - the ones the app offers, by their own names
// (lila's puzzleTheme.xml), so pool puzzles can be asked for by them.
export const PUZZLE_THEMES = [
  'fork',
  'pin',
  'skewer',
  'hangingPiece',
  'trappedPiece',
  'discoveredAttack',
  'mateIn1',
  'mateIn2',
  'mate',
  'advantage',
  'sacrifice',
  'endgame',
] as const;

export type PuzzleTheme = (typeof PUZZLE_THEMES)[number];

export const PUZZLE_THEME_LABELS: Record<PuzzleTheme, string> = {
  fork: 'Forks',
  pin: 'Pins',
  skewer: 'Skewers',
  hangingPiece: 'Hanging pieces',
  trappedPiece: 'Trapped pieces',
  discoveredAttack: 'Discovered attacks',
  mateIn1: 'Mate in 1',
  mateIn2: 'Mate in 2',
  mate: 'Mates',
  advantage: 'Winning material',
  sacrifice: 'Sacrifices',
  endgame: 'Endgames',
};

// The puzzle theme a review's fact is practice for - what a slip let the
// opponent do, or a tactic the move found or missed.
const FACT_THEMES: Partial<Record<MoveFact['kind'], PuzzleTheme>> = {
  hangs: 'hangingPiece',
  allowsFork: 'fork',
  fork: 'fork',
  allowsPin: 'pin',
  pin: 'pin',
  trapped: 'trappedPiece',
  allowsMate: 'mate',
  missesMate: 'mate',
  forcesMate: 'mate',
  mates: 'mate',
  missesWin: 'advantage',
  winsMaterial: 'advantage',
  sacrifice: 'sacrifice',
};

export function themeOfFact(kind: MoveFact['kind']): PuzzleTheme | null {
  return FACT_THEMES[kind] ?? null;
}

/** Tries at a theme before it's said to be one of your strongest or
 * weakest. */
export const THEME_STRENGTH_MIN_ATTEMPTS = 3;
const STRENGTHS_SHOWN = 3;

export type ThemeRecord = { theme: string; attempts: number; solved: number };
export type ThemeStrength = {
  theme: PuzzleTheme;
  attempts: number;
  solved: number;
  // The share solved, 0 to 1.
  rate: number;
};

/** Your strongest and weakest of the app's themes - those tried often
 * enough - by the share solved, the more tried first on a tie: the better
 * half the strongest, the rest the weakest, the worst first; at most a few
 * of each. */
export function themeStrengths(records: ThemeRecord[]): {
  strongest: ThemeStrength[];
  weakest: ThemeStrength[];
} {
  const known = records
    .filter(
      (record): record is ThemeRecord & { theme: PuzzleTheme } =>
        (PUZZLE_THEMES as readonly string[]).includes(record.theme) &&
        record.attempts >= THEME_STRENGTH_MIN_ATTEMPTS,
    )
    .map((record) => ({ ...record, rate: record.solved / record.attempts }))
    .sort((a, b) => b.rate - a.rate || b.attempts - a.attempts);
  const strongest = known.slice(
    0,
    Math.min(STRENGTHS_SHOWN, Math.ceil(known.length / 2)),
  );
  const weakest = known
    .slice(strongest.length)
    .reverse()
    .slice(0, STRENGTHS_SHOWN);
  return { strongest, weakest };
}

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

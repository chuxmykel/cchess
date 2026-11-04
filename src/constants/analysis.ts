// Where the evaluation bar goes: across the board above or below it, or
// beside it.
export type EvalBarPosition = 'top' | 'right' | 'bottom' | 'left';

// The analysis board's settings, and what they start as.
export type AnalysisSettings = {
  evalBar: boolean;
  evalBarPosition: EvalBarPosition;
  // How many of the engine's best lines are shown, each with its arrow -
  // none, 0, hides them.
  engineLineCount: number;
  bestMoveArrows: boolean;
  // What the side not to move threatens - its best move, were it its turn.
  threatArrows: boolean;
  sounds: boolean;
  // How long the engine searches each position; null searches on until
  // the position changes.
  searchSeconds: number | null;
};

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  evalBar: true,
  evalBarPosition: 'top',
  engineLineCount: 2,
  bestMoveArrows: true,
  threatArrows: false,
  sounds: true,
  searchSeconds: 3,
};

export const MAX_ENGINE_LINES = 3;

// The search time slider's seconds; one step past the last is unlimited.
export const SEARCH_SECONDS = { min: 1, max: 20 };

// The threat search looks less deep: it's a hint, and it runs beside the
// main search.
export const THREAT_DEPTH = 14;

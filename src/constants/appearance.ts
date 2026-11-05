import { BoardThemeName, DEFAULT_BOARD_THEME } from '../theme/boardThemes';

// Light or dark mode: as iOS is, or always one.
export type ColorSchemePreference = 'system' | 'light' | 'dark';

export const COLOR_SCHEME_PREFERENCES: ColorSchemePreference[] = [
  'system',
  'light',
  'dark',
];

// The board's pieces: the sets offered, by name - each drawn by
// src/components/Board/pieceSets.ts.
export type PieceSetName = 'standard';

export const PIECE_SET_NAMES: PieceSetName[] = ['standard'];

export const PIECE_SET_LABELS: Record<PieceSetName, string> = {
  standard: 'Standard',
};

export interface AppearanceSettings {
  colorScheme: ColorSchemePreference;
  boardTheme: BoardThemeName;
  pieceSet: PieceSetName;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  colorScheme: 'system',
  boardTheme: DEFAULT_BOARD_THEME,
  pieceSet: 'standard',
};

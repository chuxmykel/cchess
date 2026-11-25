import { BoardThemeName, DEFAULT_BOARD_THEME } from '../theme/boardThemes';
import { ColorThemeName, DEFAULT_COLOR_THEME } from '../theme/themes';

// Light or dark mode: as the device is (iOS or Android), or always one.
export type ColorSchemePreference = 'system' | 'light' | 'dark';

export const COLOR_SCHEME_PREFERENCES: ColorSchemePreference[] = [
  'system',
  'light',
  'dark',
];

// The app's color themes, in the order Appearance lists them: each's name,
// and the board picking it switches to - the board can still be changed on
// its own after.
export const COLOR_THEME_OPTIONS: {
  key: ColorThemeName;
  label: string;
  board: BoardThemeName;
}[] = [
  { key: 'vermilion', label: 'Paper & Vermilion', board: 'stone' },
  { key: 'brass', label: 'Midnight & Brass', board: 'slate' },
  { key: 'teal', label: 'Deep Teal', board: 'teal' },
  { key: 'violet', label: 'Violet Night', board: 'lavender' },
  { key: 'classic', label: 'Classic', board: 'test' },
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
  colorTheme: ColorThemeName;
  boardTheme: BoardThemeName;
  pieceSet: PieceSetName;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  colorScheme: 'system',
  colorTheme: DEFAULT_COLOR_THEME,
  boardTheme: DEFAULT_BOARD_THEME,
  pieceSet: 'standard',
};

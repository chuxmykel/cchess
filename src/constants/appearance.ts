import { BoardThemeName, DEFAULT_BOARD_THEME } from '../theme/boardThemes';

// Light or dark mode: as iOS is, or always one.
export type ColorSchemePreference = 'system' | 'light' | 'dark';

export const COLOR_SCHEME_PREFERENCES: ColorSchemePreference[] = [
  'system',
  'light',
  'dark',
];

export interface AppearanceSettings {
  colorScheme: ColorSchemePreference;
  boardTheme: BoardThemeName;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  colorScheme: 'system',
  boardTheme: DEFAULT_BOARD_THEME,
};

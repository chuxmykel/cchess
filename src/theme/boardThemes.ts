export interface BoardTheme {
  light: string;
  dark: string;
}

export type BoardThemeName =
  | 'stone'
  | 'slate'
  | 'teal'
  | 'lavender'
  | 'green'
  | 'wood'
  | 'monochrome'
  | 'powderblue'
  | 'test';

// The squares' colors, chosen on their own in Appearance rather than with
// light or dark mode: a board reads the same on either.
export const BOARD_THEMES: Record<BoardThemeName, BoardTheme> = {
  // The color themes' own boards (constants/appearance.ts).
  stone: {
    light: '#ece6db',
    dark: '#9a8e80',
  },
  slate: {
    light: '#e8e1cf',
    dark: '#5b6f8c',
  },
  teal: {
    light: '#dce8e5',
    dark: '#4f8a84',
  },
  lavender: {
    light: '#e7e4f5',
    dark: '#8a80c2',
  },
  green: {
    dark: '#769656',
    light: '#eeeed2',
  },
  wood: {
    dark: '#b58863',
    light: '#f1d9b4',
  },
  monochrome: {
    dark: '#888',
    light: '#fff',
  },
  powderblue: {
    light: 'powderblue',
    dark: 'grey',
  },
  test: {
    light: '#d0dff4',
    dark: '#4b648a',
  },
};

// In the order Appearance lists them.
export const BOARD_THEME_LABELS: Record<BoardThemeName, string> = {
  stone: 'Stone',
  slate: 'Slate',
  teal: 'Teal',
  lavender: 'Lavender',
  test: 'Blue',
  green: 'Green',
  wood: 'Wood',
  powderblue: 'Powder blue',
  monochrome: 'Monochrome',
};

export const DEFAULT_BOARD_THEME: BoardThemeName = 'stone';

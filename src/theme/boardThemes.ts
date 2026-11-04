export interface BoardTheme {
  light: string;
  dark: string;
}

export type BoardThemeName =
  'chess.com' | 'lichess.org' | 'monochrome' | 'powderblue' | 'test';

// The squares' colors, chosen on their own in Appearance rather than with
// light or dark mode: a board reads the same on either.
export const BOARD_THEMES: Record<BoardThemeName, BoardTheme> = {
  'chess.com': {
    dark: '#769656',
    light: '#eeeed2',
  },
  'lichess.org': {
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
  test: 'Blue',
  'chess.com': 'Green',
  'lichess.org': 'Wood',
  powderblue: 'Powder blue',
  monochrome: 'Monochrome',
};

export const DEFAULT_BOARD_THEME: BoardThemeName = 'test';

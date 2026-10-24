export interface BoardTheme {
  light: string;
  dark: string;
}

export const BOARD_THEMES: Record<string, BoardTheme> = {
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

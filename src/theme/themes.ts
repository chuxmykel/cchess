import {
  elevation,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  spacing,
  typography,
} from './tokens';

export type ThemeMode = 'light' | 'dark';

// What each color is for, not what it looks like, so a mode can give it its
// own value. Every color the app draws comes from here, apart from the board's
// squares (boardThemes.ts), which are chosen on their own.
export interface ThemeColors {
  // A screen's own background, and anything drawn to look cut out of it.
  background: string;
  // A card, row or field sitting on the background.
  surface: string;
  // A fainter fill than `surface`: an input, an unselected choice.
  surfaceSubtle: string;
  // A stronger fill than `surface`: a chat bubble, a pressed tile.
  surfaceStrong: string;
  // A sheet, popover or menu over the screen.
  surfaceRaised: string;
  // `surfaceRaised`, letting a little of what's under it through.
  surfaceTranslucent: string;
  // A loading placeholder's fill.
  skeleton: string;

  // The hairline between a list's rows.
  separator: string;
  // An input's or control's outline.
  border: string;
  // A faint line between sections.
  divider: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  // Hints and notes that mustn't compete with the text around them.
  textFaint: string;
  // A control that can't be used right now, and its icon.
  disabled: string;
  // Text and icons on an accent or status fill.
  textOnAccent: string;
  // `textOnAccent`, for what's secondary there - a time under a message.
  textOnAccentMuted: string;

  accent: string;
  // The accent as a faint fill: a selected choice.
  accentSubtle: string;
  // The accent as a soft fill: the current move, the clock that's running.
  accentSoft: string;
  // Text in the accent's color, dark enough to read on the background.
  accentText: string;
  link: string;

  danger: string;
  success: string;
  warning: string;
  // An unread count's dot.
  badge: string;
  // A friend who isn't online.
  presenceOffline: string;
  // Captured pieces under a player's name, either side's, as lichess draws
  // them: one grey that reads on any background.
  capturedPiece: string;

  // A tooltip: the reverse of the screen around it.
  inverseSurface: string;
  inverseText: string;

  // Dims the screen under a sheet.
  scrim: string;
  // A dark band over anything - a toast, an avatar's score.
  overlay: string;
  onOverlay: string;
  shadow: string;

  ratingUp: string;
  ratingDown: string;
  ratingEven: string;
  // A category's results, in its stats and a player's activity.
  results: { win: string; draw: string; loss: string };
  gameType: { bullet: string; blitz: string; rapid: string; classical: string };

  chart: { selection: string; guide: string; grid: string };
  // EmptyState's drawings.
  illustration: { light: string; pale: string; grey: string; dark: string };

  // Drawn on and around the board. Most are the same in both modes, since
  // the squares under them are.
  board: {
    // Fades the board under a card or menu drawn over it.
    veil: string;
    lastMove: string;
    // A legal move's dot or ring, and the drop guide's circle.
    moveHint: string;
    // The held piece's own square while it's dragged.
    dragOrigin: string;
    // A king in check.
    check: string;
    promotionTile: string;
    promotionTilePressed: string;
    // The position editor's palette: a light grey panel - the same in both
    // modes, so black pieces show on a dark screen too - and its own tools'
    // icons drawn on it.
    palette: string;
    paletteIcon: string;
    // An engine line's arrow, best first, and the threat's.
    arrows: readonly string[];
    threatArrow: string;
  };
  evalBar: { white: string; black: string; onWhite: string; onBlack: string };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  fontFamily: typeof fontFamily;
  typography: typeof typography;
  elevation: typeof elevation;
}

const scales = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  fontFamily,
  typography,
  elevation,
};

// The same in both modes: they mean a chess side, or sit on the squares.
const sharedBoardColors = {
  lastMove: 'rgba(155, 199, 0, 0.41)',
  moveHint: 'rgba(70, 70, 70, 0.4)',
  dragOrigin: 'rgba(255, 210, 60, 0.5)',
  palette: '#dcdfe3',
  paletteIcon: '#4b4f55',
  arrows: [
    'rgba(98, 153, 88, 0.62)',
    'rgba(98, 153, 88, 0.42)',
    'rgba(98, 153, 88, 0.3)',
  ],
  threatArrow: 'rgba(214, 96, 86, 0.58)',
} as const;

const evalBar = {
  white: '#f2f2f2',
  black: '#3a3a3a',
  onWhite: '#222',
  onBlack: '#eee',
};

export const lightTheme: Theme = {
  mode: 'light',
  ...scales,
  colors: {
    background: '#fff',
    surface: '#f0f0f0',
    surfaceSubtle: '#f7f7f7',
    surfaceStrong: '#eaeaea',
    surfaceRaised: '#fff',
    surfaceTranslucent: 'rgba(255, 255, 255, 0.96)',
    skeleton: '#e6e6e6',

    separator: '#c8c8c8',
    border: '#d0d0d0',
    divider: '#e0e0e0',

    text: '#222',
    textSecondary: '#555',
    textMuted: '#888',
    textFaint: '#aaa',
    disabled: '#c4c4c4',
    textOnAccent: '#fff',
    textOnAccentMuted: 'rgba(255, 255, 255, 0.8)',

    accent: '#769656',
    accentSubtle: '#eef4e8',
    accentSoft: '#e3edd8',
    accentText: '#2f6f3e',
    link: '#2a7ae2',

    danger: '#e53935',
    success: '#4caf50',
    warning: '#c99a1c',
    badge: '#e53935',
    presenceOffline: '#bbb',
    capturedPiece: '#888',

    inverseSurface: '#333',
    inverseText: '#fff',

    scrim: 'rgba(0, 0, 0, 0.4)',
    overlay: 'rgba(0, 0, 0, 0.65)',
    onOverlay: 'rgba(255, 255, 255, 0.85)',
    shadow: '#000',

    ratingUp: '#4caf50',
    ratingDown: '#e53935',
    ratingEven: '#888',
    results: { win: '#5a9e2f', draw: '#c99a1c', loss: '#c8402a' },
    gameType: {
      bullet: '#F5A623',
      blitz: '#E8601C',
      rapid: '#8E6E53',
      classical: '#3A3A3A',
    },

    chart: { selection: '#A8C98A', guide: '#c4c4c4', grid: '#e0e0e0' },
    illustration: {
      light: '#dfe8d3',
      pale: '#eef3e8',
      grey: '#d5d5d5',
      dark: '#4a4a4a',
    },

    board: {
      ...sharedBoardColors,
      veil: 'rgba(255, 255, 255, 0.55)',
      check: '#e53935',
      promotionTile: '#e9ebee',
      promotionTilePressed: '#d5d9de',
    },
    evalBar,
  },
};

// The same roles on dark greys, like lichess's: the accent kept, text and
// status colors lifted so they read on the darker ground. Hex colors stay
// six digits where a component adds an alpha to them (the rating chart's
// fill under its line).
export const darkTheme: Theme = {
  mode: 'dark',
  ...scales,
  colors: {
    background: '#161512',
    surface: '#262421',
    surfaceSubtle: '#1f1e1b',
    surfaceStrong: '#33312d',
    surfaceRaised: '#2a2825',
    surfaceTranslucent: 'rgba(42, 40, 37, 0.96)',
    skeleton: '#2e2c29',

    separator: '#3d3a36',
    border: '#4a4743',
    divider: '#33312d',

    text: '#e8e6e3',
    textSecondary: '#bab7b2',
    textMuted: '#8c8984',
    textFaint: '#6d6a65',
    disabled: '#5a5752',
    textOnAccent: '#fff',
    textOnAccentMuted: 'rgba(255, 255, 255, 0.8)',

    accent: '#769656',
    accentSubtle: '#232b1c',
    accentSoft: '#2f3b24',
    accentText: '#9cc37a',
    link: '#5b9cf0',

    danger: '#ef5350',
    success: '#66bb6a',
    warning: '#d6a930',
    badge: '#e53935',
    presenceOffline: '#6d6a65',
    capturedPiece: '#888',

    inverseSurface: '#e8e6e3',
    inverseText: '#161512',

    scrim: 'rgba(0, 0, 0, 0.6)',
    overlay: 'rgba(0, 0, 0, 0.75)',
    onOverlay: 'rgba(255, 255, 255, 0.9)',
    shadow: '#000',

    ratingUp: '#66bb6a',
    ratingDown: '#ef5350',
    ratingEven: '#8c8984',
    results: { win: '#6fb83f', draw: '#d6a930', loss: '#e0573f' },
    gameType: {
      bullet: '#F5A623',
      blitz: '#F0763A',
      rapid: '#B08F72',
      classical: '#bab7b2',
    },

    chart: { selection: '#A8C98A', guide: '#5a5752', grid: '#33312d' },
    illustration: {
      light: '#33402a',
      pale: '#232b1c',
      grey: '#4a4743',
      dark: '#bab7b2',
    },

    board: {
      ...sharedBoardColors,
      veil: 'rgba(22, 21, 18, 0.55)',
      check: '#ef5350',
      promotionTile: '#3a3835',
      promotionTilePressed: '#4a4743',
    },
    evalBar,
  },
};

export const THEMES: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

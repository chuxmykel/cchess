import type { MoveClass } from '../domain/review/types';
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
  // A choice drawn with a piece on it - Play as's kings - and its label,
  // then the same once picked. On a dark screen, a mid grey either king
  // shows on (tinted with the accent once picked), its label lighter.
  pieceChoice: string;
  pieceChoiceSelected: string;
  pieceChoiceLabel: string;
  pieceChoiceLabelSelected: string;
  // Text in the accent's color, dark enough to read on the background.
  accentText: string;
  link: string;

  danger: string;
  success: string;
  warning: string;
  // An unread count's dot.
  badge: string;
  // The pill behind a section's count: a see-through grey, the same in
  // both modes, so it shows a shade off the page in either.
  countPill: string;
  // A switch's thumb: white, as iOS draws it - Android's would otherwise be
  // its own blue.
  switchThumb: string;
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
  gameType: {
    bullet: string;
    blitz: string;
    rapid: string;
    classical: string;
    daily: string;
  };

  chart: { selection: string; guide: string; grid: string };
  // The opening explorer's bar of how a move's games ended: white's wins,
  // draws, black's - as lichess draws it.
  explorer: { white: string; draw: string; black: string };
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
    // A queued pre-move's two squares: apart from lastMove's green, and
    // from the default board's blue - lichess's dark blue would vanish on
    // it - so a red.
    premove: string;
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
  // A game review's classes of move - on the board's squares and beside
  // the moves, so the same in both modes - and the mark drawn on them.
  moveClass: Record<MoveClass, string>;
  onMoveClass: string;
  // The review's speech bubble.
  reviewBubble: string;
  // The app's mark, as Home's header draws it: a tile and its two squares.
  logo: { tile: string; squares: string };
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
  premove: 'rgba(214, 64, 64, 0.5)',
  palette: '#dcdfe3',
  paletteIcon: '#4b4f55',
  arrows: [
    'rgba(98, 153, 88, 0.62)',
    'rgba(98, 153, 88, 0.42)',
    'rgba(98, 153, 88, 0.3)',
  ],
  threatArrow: 'rgba(214, 96, 86, 0.58)',
} as const;

// Green for the good, the stronger the better; then yellow, orange and red
// for the slips, as lichess marks ?!, ? and ??; teal and blue for the
// standouts, brown for the book, and a pale green for a forced move - the
// only one there was, so the best, if no find.
const moveClass: Record<MoveClass, string> = {
  brilliant: '#26a69a',
  great: '#5c8fd6',
  best: '#6aa84f',
  excellent: '#8bbf4e',
  good: '#93ae80',
  book: '#a3825c',
  forced: '#9cc27a',
  inaccuracy: '#e2b31d',
  mistake: '#e8892a',
  miss: '#e2645a',
  blunder: '#d03a32',
};

const evalBar = {
  white: '#f2f2f2',
  black: '#3a3a3a',
  onWhite: '#222',
  onBlack: '#eee',
};

const classicLightTheme: Theme = {
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
    pieceChoice: '#f7f7f7',
    pieceChoiceSelected: '#eef4e8',
    pieceChoiceLabel: '#888',
    pieceChoiceLabelSelected: '#769656',
    accentText: '#2f6f3e',
    link: '#2a7ae2',

    danger: '#e53935',
    success: '#4caf50',
    warning: '#c99a1c',
    badge: '#e53935',
    countPill: 'rgba(120, 120, 128, 0.2)',
    switchThumb: '#ffffff',
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
      daily: '#2E9C8F',
    },

    chart: { selection: '#A8C98A', guide: '#c4c4c4', grid: '#e0e0e0' },
    explorer: { white: '#f5f5f5', draw: '#a3a3a3', black: '#3a3a3a' },
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
    moveClass,
    onMoveClass: '#fff',
    reviewBubble: '#fff',
    logo: { tile: '#769656', squares: '#eeeed2' },
  },
};

// The same roles on dark greys, like lichess's: the accent kept, text and
// status colors lifted so they read on the darker ground. Hex colors stay
// six digits where a component adds an alpha to them (the rating chart's
// fill under its line).
const classicDarkTheme: Theme = {
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
    pieceChoice: '#56534e',
    pieceChoiceSelected: '#52603f',
    pieceChoiceLabel: '#e8e6e3',
    pieceChoiceLabelSelected: '#9cc37a',
    accentText: '#9cc37a',
    link: '#5b9cf0',

    danger: '#ef5350',
    success: '#66bb6a',
    warning: '#d6a930',
    badge: '#e53935',
    countPill: 'rgba(120, 120, 128, 0.2)',
    switchThumb: '#ffffff',
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
      daily: '#4FB8AA',
    },

    chart: { selection: '#A8C98A', guide: '#5a5752', grid: '#33312d' },
    explorer: { white: '#e8e6e3', draw: '#7a7772', black: '#161512' },
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
    moveClass,
    onMoveClass: '#fff',
    reviewBubble: '#33312d',
    logo: { tile: '#769656', squares: '#eeeed2' },
  },
};

// The app's color themes, chosen in Appearance: each a light and a dark
// theme. Classic is the green the app started with; the others are drawn
// from a few colors each (`Palette`), the rest worked out from them - the
// colors that mean something on the board, in a review or a chart stay
// Classic's.
export type ColorThemeName =
  'classic' | 'brass' | 'vermilion' | 'teal' | 'violet';

// A theme's few chosen colors, in one mode.
interface Palette {
  background: string;
  // Cards and sheets: lighter than the background in light mode, as paper
  // on a desk.
  surface: string;
  text: string;
  textMuted: string;
  separator: string;
  accent: string;
  textOnAccent: string;
  // The accent as text, dark (or light) enough to read on the background.
  accentText: string;
  accentSubtle: string;
  // The last move's squares, drawn see-through over the board.
  lastMove: string;
  // The logo: its tile and its two squares.
  logo: { tile: string; squares: string };
}

function channels(hex: string): number[] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

// `from` moved `amount` (0-1) of the way to `to`, as a six-digit hex.
function mix(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  return `#${a
    .map((c, i) =>
      Math.round(c + (b[i] - c) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// A theme from Classic's, in the same mode, with a palette's colors in
// every role that carries the look.
function themeFrom(base: Theme, p: Palette): Theme {
  const dark = base.mode === 'dark';
  const { colors } = base;
  return {
    ...base,
    colors: {
      ...colors,
      background: p.background,
      surface: p.surface,
      surfaceSubtle: mix(p.background, p.text, dark ? 0.03 : 0.025),
      surfaceStrong: mix(p.background, p.text, dark ? 0.12 : 0.07),
      surfaceRaised: dark ? mix(p.surface, p.text, 0.03) : p.surface,
      surfaceTranslucent: withAlpha(
        dark ? mix(p.surface, p.text, 0.03) : p.surface,
        0.96,
      ),
      skeleton: mix(p.background, p.text, dark ? 0.1 : 0.07),
      separator: p.separator,
      border: mix(p.separator, p.text, dark ? 0.12 : 0.08),
      divider: mix(p.separator, p.background, 0.3),
      text: p.text,
      textSecondary: mix(p.text, p.background, dark ? 0.22 : 0.28),
      textMuted: p.textMuted,
      textFaint: mix(p.textMuted, p.background, 0.35),
      disabled: mix(p.textMuted, p.background, 0.5),
      textOnAccent: p.textOnAccent,
      textOnAccentMuted: withAlpha(p.textOnAccent, 0.8),
      accent: p.accent,
      accentSubtle: p.accentSubtle,
      accentSoft: mix(p.background, p.accent, dark ? 0.24 : 0.16),
      pieceChoiceSelected: dark
        ? mix(colors.pieceChoice, p.accent, 0.35)
        : p.accentSubtle,
      pieceChoiceLabelSelected: p.accentText,
      accentText: p.accentText,
      inverseSurface: dark ? p.text : colors.inverseSurface,
      inverseText: dark ? p.background : colors.inverseText,
      chart: {
        selection: mix(p.accent, p.background, dark ? 0.25 : 0.4),
        guide: mix(p.textMuted, p.background, 0.4),
        grid: p.separator,
      },
      illustration: {
        ...colors.illustration,
        light: mix(p.background, p.accent, dark ? 0.28 : 0.2),
        pale: mix(p.background, p.accent, dark ? 0.12 : 0.08),
      },
      logo: p.logo,
      board: {
        ...colors.board,
        lastMove: withAlpha(p.lastMove, 0.5),
        veil: dark ? withAlpha(p.background, 0.55) : colors.board.veil,
      },
      reviewBubble: dark ? mix(p.background, p.text, 0.12) : p.surface,
    },
  };
}

const PALETTES: Record<
  Exclude<ColorThemeName, 'classic'>,
  Record<ThemeMode, Palette>
> = {
  // Navy and brass: a club room at night.
  brass: {
    light: {
      background: '#f5f4ef',
      surface: '#ffffff',
      text: '#1b2230',
      textMuted: '#5b6373',
      separator: '#e1dfd6',
      accent: '#1f3a5f',
      textOnAccent: '#ffffff',
      accentText: '#1f3a5f',
      accentSubtle: '#e6eaf0',
      lastMove: '#d4a24c',
      logo: { tile: '#1f3a5f', squares: '#d4a24c' },
    },
    dark: {
      background: '#0e1421',
      surface: '#172033',
      text: '#e9ecf2',
      textMuted: '#9aa3b5',
      separator: '#263049',
      accent: '#d4a24c',
      textOnAccent: '#1b1405',
      accentText: '#e3b866',
      accentSubtle: '#22304a',
      lastMove: '#d4a24c',
      logo: { tile: '#d4a24c', squares: '#0e1421' },
    },
  },
  // Paper, ink and one vermilion red: a printed chess book.
  vermilion: {
    light: {
      background: '#faf7f0',
      surface: '#ffffff',
      text: '#1f1a17',
      textMuted: '#685f57',
      separator: '#e6dfd2',
      accent: '#c2411a',
      textOnAccent: '#ffffff',
      accentText: '#b03a16',
      accentSubtle: '#f6e6de',
      lastMove: '#e8673f',
      logo: { tile: '#c2411a', squares: '#faf7f0' },
    },
    dark: {
      background: '#191613',
      surface: '#24201c',
      text: '#f1ebe2',
      textMuted: '#a89f94',
      separator: '#39332d',
      accent: '#e8673f',
      textOnAccent: '#1a0e08',
      accentText: '#f08a66',
      accentSubtle: '#3a2a22',
      lastMove: '#e8673f',
      logo: { tile: '#e8673f', squares: '#191613' },
    },
  },
  // Teal with a yellow highlight: an analysis tool.
  teal: {
    light: {
      background: '#f2f6f6',
      surface: '#ffffff',
      text: '#10201f',
      textMuted: '#566866',
      separator: '#dae3e2',
      accent: '#0f766e',
      textOnAccent: '#ffffff',
      accentText: '#0e6b64',
      accentSubtle: '#ddf0ee',
      lastMove: '#f2c94c',
      logo: { tile: '#0f766e', squares: '#ccfbf1' },
    },
    dark: {
      background: '#0a1312',
      surface: '#131f1e',
      text: '#e3eeec',
      textMuted: '#8fa5a2',
      separator: '#22322f',
      accent: '#2dd4bf',
      textOnAccent: '#04201c',
      accentText: '#5ee0cf',
      accentSubtle: '#163330',
      lastMove: '#f2c94c',
      logo: { tile: '#2dd4bf', squares: '#0a1312' },
    },
  },
  // Violet with an amber highlight: friendly, a little playful.
  violet: {
    light: {
      background: '#f6f5fb',
      surface: '#ffffff',
      text: '#1c1a2e',
      textMuted: '#5f5c75',
      separator: '#e2e0ee',
      accent: '#5b4bd6',
      textOnAccent: '#ffffff',
      accentText: '#4f3fc8',
      accentSubtle: '#ece9fb',
      lastMove: '#f5b14c',
      logo: { tile: '#5b4bd6', squares: '#f6f5fb' },
    },
    dark: {
      background: '#110f21',
      surface: '#1b1830',
      text: '#eceaf7',
      textMuted: '#a09cbd',
      separator: '#2c2846',
      accent: '#8b7cf6',
      textOnAccent: '#120e2b',
      accentText: '#a99df8',
      accentSubtle: '#272246',
      lastMove: '#f5b14c',
      logo: { tile: '#8b7cf6', squares: '#110f21' },
    },
  },
};

export const COLOR_THEMES: Record<ColorThemeName, Record<ThemeMode, Theme>> = {
  classic: { light: classicLightTheme, dark: classicDarkTheme },
  brass: {
    light: themeFrom(classicLightTheme, PALETTES.brass.light),
    dark: themeFrom(classicDarkTheme, PALETTES.brass.dark),
  },
  vermilion: {
    light: themeFrom(classicLightTheme, PALETTES.vermilion.light),
    dark: themeFrom(classicDarkTheme, PALETTES.vermilion.dark),
  },
  teal: {
    light: themeFrom(classicLightTheme, PALETTES.teal.light),
    dark: themeFrom(classicDarkTheme, PALETTES.teal.dark),
  },
  violet: {
    light: themeFrom(classicLightTheme, PALETTES.violet.light),
    dark: themeFrom(classicDarkTheme, PALETTES.violet.dark),
  },
};

export const DEFAULT_COLOR_THEME: ColorThemeName = 'vermilion';

// The default color theme's: what a new install shows, and what a
// component rendered outside a ThemeProvider - in a test - gets.
export const lightTheme = COLOR_THEMES[DEFAULT_COLOR_THEME].light;
export const darkTheme = COLOR_THEMES[DEFAULT_COLOR_THEME].dark;

export const THEMES: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

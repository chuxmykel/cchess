import { TextStyle } from 'react-native';

// The app's style guide: the scales every component's styles are built from,
// the same in light and dark mode. Colors, which change with the mode, are in
// themes.ts. A layout's own measurements (a board's size, an avatar's) stay
// with the component; these are for the space, type and corners between.

// Padding, margins and gaps, on a 4pt grid.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Corners. A circle is `size / 2`, or `pill` when its size isn't known here.
export const radius = {
  hairline: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const fontSize = {
  // The smallest badges and labels squeezed into a board's edge or an avatar.
  micro: 9,
  xxs: 10,
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  h3: 20,
  h2: 22,
  h1: 28,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

// The system font; set `base` to swap the whole app's typeface.
export const fontFamily = {
  base: undefined as string | undefined,
  mono: 'Menlo',
} as const;

// Ready-made text styles, for text that's one of these rather than its own.
export const typography = {
  display: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  heading: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.lg,
  },
  bodyStrong: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
  },
} as const satisfies Record<string, TextStyle>;

// Raised surfaces: `sm` a card resting on the screen, `md` one floating over
// it, `lg` a menu or popup. The color comes from the theme.
export const elevation = {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

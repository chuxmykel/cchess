import {
  DarkTheme,
  DefaultTheme,
  Theme as NavTheme,
} from '@react-navigation/native';

import { Theme } from './themes';

// React Navigation's own theme, from ours: headers and the tab bar on the
// background, a screen with none of its own on the surface below them.
export function navigationTheme(theme: Theme): NavTheme {
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const { colors } = theme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.surface,
      card: colors.background,
      text: colors.text,
      border: colors.separator,
      notification: colors.badge,
    },
  };
}

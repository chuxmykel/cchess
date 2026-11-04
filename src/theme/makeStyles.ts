import { StyleSheet } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { Theme } from './themes';

// What StyleSheet.create takes.
type Styles = Parameters<typeof StyleSheet.create>[0];

// A component's StyleSheet, drawn from the theme: returns the hook that gives
// the styles for the theme in use. Each theme's sheet is made once and kept,
// not made again on every render.
//
//   const useStyles = makeStyles((t) => ({
//     card: { backgroundColor: t.colors.surface, padding: t.spacing.lg },
//   }));
//   // in the component:
//   const styles = useStyles();
export function makeStyles<S extends Styles>(
  create: (theme: Theme) => S & Styles,
): () => Readonly<S> {
  const sheets = new WeakMap<Theme, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    let sheet = sheets.get(theme);
    if (!sheet) {
      sheet = StyleSheet.create(create(theme));
      sheets.set(theme, sheet);
    }
    return sheet;
  };
}

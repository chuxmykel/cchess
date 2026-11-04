import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, Theme } from '../theme/themes';

const ThemeContext = createContext<Theme | null>(null);

// The theme every component's styles are drawn from, for the whole app:
// dark while iOS is.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// The light theme outside a ThemeProvider, so a component renders on its own
// - in a test, say - just as it does in the app by default.
export function useTheme(): Theme {
  return useContext(ThemeContext) ?? lightTheme;
}

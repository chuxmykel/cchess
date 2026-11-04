import { createContext, useContext } from 'react';

import { lightTheme, Theme } from '../theme/themes';

const ThemeContext = createContext<Theme | null>(null);

// The theme every component's styles are drawn from, for the whole app.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>
);

// The light theme outside a ThemeProvider, so a component renders on its own
// - in a test, say - just as it does in the app by default.
export function useTheme(): Theme {
  return useContext(ThemeContext) ?? lightTheme;
}

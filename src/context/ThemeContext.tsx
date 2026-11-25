import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  DEFAULT_APPEARANCE_SETTINGS,
  PieceSetName,
} from '../constants/appearance';
import {
  AppearanceSettingsState,
  useAppearanceSettings,
} from '../hooks/useAppearanceSettings';
import { BOARD_THEMES, BoardTheme } from '../theme/boardThemes';
import { COLOR_THEMES, lightTheme, Theme } from '../theme/themes';

const ThemeContext = createContext<Theme | null>(null);
const AppearanceContext = createContext<AppearanceSettingsState | null>(null);

// The theme every component's styles are drawn from, for the whole app -
// the color theme chosen in Appearance, dark while the device is unless
// Appearance says always light or dark - and the appearance settings
// behind it.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const appearance = useAppearanceSettings();
  const systemScheme = useColorScheme();
  const { colorScheme, colorTheme } = appearance.settings;
  const scheme = colorScheme === 'system' ? systemScheme : colorScheme;
  const theme = COLOR_THEMES[colorTheme][scheme === 'dark' ? 'dark' : 'light'];
  return (
    <AppearanceContext.Provider value={appearance}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </AppearanceContext.Provider>
  );
};

// The default color theme's light theme outside a ThemeProvider, so a component renders on its own
// - in a test, say - just as it does in the app by default.
export function useTheme(): Theme {
  return useContext(ThemeContext) ?? lightTheme;
}

export function useAppearance(): AppearanceSettingsState {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within a ThemeProvider');
  }
  return context;
}

// The board's square colors as chosen in Appearance - the default board's
// outside a ThemeProvider, like useTheme.
export function useBoardColors(): BoardTheme {
  const context = useContext(AppearanceContext);
  const name =
    context?.settings.boardTheme ?? DEFAULT_APPEARANCE_SETTINGS.boardTheme;
  return useMemo(() => BOARD_THEMES[name], [name]);
}

// The board's pieces as chosen in Appearance, by name - the default set
// outside a ThemeProvider, like useTheme.
export function usePieceSetName(): PieceSetName {
  const context = useContext(AppearanceContext);
  return context?.settings.pieceSet ?? DEFAULT_APPEARANCE_SETTINGS.pieceSet;
}

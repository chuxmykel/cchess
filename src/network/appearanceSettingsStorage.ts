import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AppearanceSettings,
  COLOR_SCHEME_PREFERENCES,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../constants/appearance';
import { BOARD_THEMES } from '../theme/boardThemes';

const APPEARANCE_SETTINGS_KEY = 'cchess.appearanceSettings';

// The settings as last saved, over the defaults - so one that's since been
// removed (a board theme no longer offered) falls back to its default. The
// defaults alone if nothing's saved, or it can't be read.
export async function loadAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const saved = await AsyncStorage.getItem(APPEARANCE_SETTINGS_KEY);
    if (!saved) return DEFAULT_APPEARANCE_SETTINGS;
    const { colorScheme, boardTheme } = JSON.parse(saved);
    return {
      colorScheme: COLOR_SCHEME_PREFERENCES.includes(colorScheme)
        ? colorScheme
        : DEFAULT_APPEARANCE_SETTINGS.colorScheme,
      boardTheme: Object.prototype.hasOwnProperty.call(BOARD_THEMES, boardTheme)
        ? boardTheme
        : DEFAULT_APPEARANCE_SETTINGS.boardTheme,
    };
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
}

export async function saveAppearanceSettings(
  settings: AppearanceSettings,
): Promise<void> {
  await AsyncStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AppearanceSettings,
  COLOR_SCHEME_PREFERENCES,
  DEFAULT_APPEARANCE_SETTINGS,
  PIECE_SET_NAMES,
} from '../constants/appearance';
import { BOARD_THEMES } from '../theme/boardThemes';
import { COLOR_THEMES } from '../theme/themes';

const APPEARANCE_SETTINGS_KEY = 'cchess.appearanceSettings';

// The settings as last saved, over the defaults - so one that's since been
// removed (a color theme, board theme or piece set no longer offered) falls back to its default. The
// defaults alone if nothing's saved, or it can't be read.
export async function loadAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const saved = await AsyncStorage.getItem(APPEARANCE_SETTINGS_KEY);
    if (!saved) return DEFAULT_APPEARANCE_SETTINGS;
    const { colorScheme, colorTheme, boardTheme, pieceSet } = JSON.parse(saved);
    return {
      colorScheme: COLOR_SCHEME_PREFERENCES.includes(colorScheme)
        ? colorScheme
        : DEFAULT_APPEARANCE_SETTINGS.colorScheme,
      colorTheme: Object.prototype.hasOwnProperty.call(COLOR_THEMES, colorTheme)
        ? colorTheme
        : DEFAULT_APPEARANCE_SETTINGS.colorTheme,
      boardTheme: Object.prototype.hasOwnProperty.call(BOARD_THEMES, boardTheme)
        ? boardTheme
        : DEFAULT_APPEARANCE_SETTINGS.boardTheme,
      pieceSet: PIECE_SET_NAMES.includes(pieceSet)
        ? pieceSet
        : DEFAULT_APPEARANCE_SETTINGS.pieceSet,
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

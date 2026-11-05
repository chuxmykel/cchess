import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DailyGameSettings,
  DEFAULT_DAILY_GAME_SETTINGS,
} from '../constants/dailyGame';

const DAILY_GAME_SETTINGS_KEY = 'cchess.dailyGameSettings';

// The settings as last saved, over the defaults - so a setting added since
// starts at its default. The defaults alone if nothing's saved, or it
// can't be read.
export async function loadDailyGameSettings(): Promise<DailyGameSettings> {
  try {
    const saved = await AsyncStorage.getItem(DAILY_GAME_SETTINGS_KEY);
    if (!saved) return DEFAULT_DAILY_GAME_SETTINGS;
    const { confirmMoves } = JSON.parse(saved);
    return {
      ...DEFAULT_DAILY_GAME_SETTINGS,
      ...(typeof confirmMoves === 'boolean' ? { confirmMoves } : {}),
    };
  } catch {
    return DEFAULT_DAILY_GAME_SETTINGS;
  }
}

export async function saveDailyGameSettings(
  settings: DailyGameSettings,
): Promise<void> {
  await AsyncStorage.setItem(DAILY_GAME_SETTINGS_KEY, JSON.stringify(settings));
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AnalysisSettings,
  DEFAULT_ANALYSIS_SETTINGS,
} from '../constants/analysis';

const ANALYSIS_SETTINGS_KEY = 'cchess.analysisSettings';

// The settings as last saved, over the defaults - so a setting added since
// starts at its default, and one since replaced (a depth, now a search time)
// is dropped. The defaults alone if nothing's saved, or it can't
// be read.
export async function loadAnalysisSettings(): Promise<AnalysisSettings> {
  try {
    const saved = await AsyncStorage.getItem(ANALYSIS_SETTINGS_KEY);
    if (!saved) return DEFAULT_ANALYSIS_SETTINGS;
    const { engineLines, depth: _depth, ...rest } = JSON.parse(saved);
    return {
      ...DEFAULT_ANALYSIS_SETTINGS,
      // Saved before lines had a count: switched off, they're none.
      ...(engineLines === false ? { engineLineCount: 0 } : {}),
      ...rest,
    };
  } catch {
    return DEFAULT_ANALYSIS_SETTINGS;
  }
}

export async function saveAnalysisSettings(
  settings: AnalysisSettings,
): Promise<void> {
  await AsyncStorage.setItem(ANALYSIS_SETTINGS_KEY, JSON.stringify(settings));
}

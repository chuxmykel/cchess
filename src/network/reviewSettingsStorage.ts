import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_REVIEW_SETTINGS,
  REVIEW_AS_LABELS,
  REVIEW_STRENGTHS,
  ReviewSettings,
} from '../constants/review';

const REVIEW_SETTINGS_KEY = 'cchess.reviewSettings';

// The settings as last saved, over the defaults - so a setting added since
// starts at its default, and a value no longer offered falls back to its
// own. The defaults alone if nothing's saved, or it can't be read.
export async function loadReviewSettings(): Promise<ReviewSettings> {
  try {
    const saved = await AsyncStorage.getItem(REVIEW_SETTINGS_KEY);
    if (!saved) return DEFAULT_REVIEW_SETTINGS;
    const parsed = JSON.parse(saved);
    const settings: ReviewSettings = { ...DEFAULT_REVIEW_SETTINGS };
    for (const key of ['voice', 'showBestMoves', 'evalBar'] as const) {
      if (typeof parsed[key] === 'boolean') settings[key] = parsed[key];
    }
    if (typeof parsed.voiceId === 'string') settings.voiceId = parsed.voiceId;
    if (Object.keys(REVIEW_AS_LABELS).includes(parsed.reviewAs)) {
      settings.reviewAs = parsed.reviewAs;
    }
    if (REVIEW_STRENGTHS.includes(parsed.strength)) {
      settings.strength = parsed.strength;
    }
    return settings;
  } catch {
    return DEFAULT_REVIEW_SETTINGS;
  }
}

export async function saveReviewSettings(
  settings: ReviewSettings,
): Promise<void> {
  await AsyncStorage.setItem(REVIEW_SETTINGS_KEY, JSON.stringify(settings));
}

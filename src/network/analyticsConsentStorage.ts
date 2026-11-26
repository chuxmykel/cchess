import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_CONSENT_KEY = 'cchess.analyticsEnabled';

/** Whether the player shares usage and crash data - yes unless they've
 * turned it off, or it can't be read. */
export async function loadAnalyticsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function saveAnalyticsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, String(enabled));
}

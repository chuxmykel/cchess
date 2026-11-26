import { Platform } from 'react-native';

/** Where the app is updated from. The App Store's page has an ID only once
 * the app's record exists in App Store Connect: until it's set here, the
 * App Store's search for the app. */
const APP_STORE_ID: string | null = null;
const IOS_STORE_URL = APP_STORE_ID
  ? `https://apps.apple.com/app/id${APP_STORE_ID}`
  : 'https://apps.apple.com/search?term=cchess';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=dev.chux.cchess';

export const STORE_URL =
  Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;

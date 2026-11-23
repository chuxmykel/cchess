import type PostHog from 'posthog-react-native';

// Product analytics and crash reports, through PostHog's EU cloud. Off
// unless the build has a project key (EXPO_PUBLIC_POSTHOG_KEY) - and then
// still off for a player who turns it off in Settings. Events carry a
// random install ID and the device's model and OS, never an IP-derived
// location (disableGeoip) or anything the player wrote.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || undefined;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

/** What the app reports doing, besides the screens it shows. */
export type AnalyticsEvent =
  'account_created' | 'account_deleted' | 'game_finished' | 'report_sent';

type Properties = Record<string, string | number | boolean | null>;

let client: PostHog | null = null;

/** The PostHog client, made the first time it's needed - and only with a
 * key, so a build without one never loads the SDK. */
function posthog(): PostHog | null {
  if (!KEY) return null;
  if (!client) {
    // Required here, not imported: a build (or test) without a key never
    // loads it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostHog: Client } = require('posthog-react-native');
    client = new Client(KEY, {
      host: HOST,
      disableGeoip: true,
      captureAppLifecycleEvents: true,
      errorTracking: { autocapture: true },
      personProfiles: 'identified_only',
    }) as PostHog;
  }
  return client;
}

export const isAnalyticsAvailable = KEY !== undefined;

export const analytics = {
  capture(event: AnalyticsEvent, properties?: Properties): void {
    posthog()?.capture(event, properties);
  },
  screen(name: string): void {
    void posthog()?.screen(name);
  },
  /** A signed-in account: its ID, nothing else about it. */
  identify(userId: string): void {
    posthog()?.identify(userId);
  },
  /** Signed out, or a new guest: no longer that account. */
  reset(): void {
    posthog()?.reset();
  },
  setEnabled(enabled: boolean): void {
    const instance = posthog();
    if (!instance) return;
    void (enabled ? instance.optIn() : instance.optOut());
  },
};

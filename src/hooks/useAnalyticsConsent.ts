import { useCallback, useEffect, useState } from 'react';

import { analytics } from '../analytics/analytics';
import {
  loadAnalyticsEnabled,
  saveAnalyticsEnabled,
} from '../network/analyticsConsentStorage';

/** The Settings switch for sharing usage and crash data: kept on the
 * device, and passed to the analytics client as it changes. */
export function useAnalyticsConsent(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    loadAnalyticsEnabled().then(setEnabledState);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    analytics.setEnabled(next);
    void saveAnalyticsEnabled(next);
  }, []);

  return { enabled, setEnabled };
}

/** Once on launch: the analytics client told the player's choice. */
export function applySavedAnalyticsConsent(): Promise<void> {
  return loadAnalyticsEnabled().then(analytics.setEnabled);
}

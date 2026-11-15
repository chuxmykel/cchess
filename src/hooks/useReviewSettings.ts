import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReviewSettings, DEFAULT_REVIEW_SETTINGS } from '../constants/review';
import {
  loadReviewSettings,
  saveReviewSettings,
} from '../network/reviewSettingsStorage';

// The game review's settings, kept on the device: the defaults until what was
// saved has loaded, then each change saved as it's made.
export type ReviewSettingsState = {
  settings: ReviewSettings;
  update: (change: Partial<ReviewSettings>) => void;
};

export function useReviewSettings(): ReviewSettingsState {
  const [settings, setSettings] = useState(DEFAULT_REVIEW_SETTINGS);

  useEffect(() => {
    let current = true;
    loadReviewSettings().then((loaded) => {
      if (current) setSettings(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  const update = useCallback((change: Partial<ReviewSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...change };
      saveReviewSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return useMemo(() => ({ settings, update }), [settings, update]);
}

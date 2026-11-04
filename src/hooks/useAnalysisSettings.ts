import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AnalysisSettings,
  DEFAULT_ANALYSIS_SETTINGS,
} from '../constants/analysis';
import {
  loadAnalysisSettings,
  saveAnalysisSettings,
} from '../network/analysisSettingsStorage';

// The analysis board's settings, kept on the device: the defaults until
// what was saved has loaded, then each change saved as it's made.
export type AnalysisSettingsState = {
  settings: AnalysisSettings;
  update: (change: Partial<AnalysisSettings>) => void;
};

export function useAnalysisSettings(): AnalysisSettingsState {
  const [settings, setSettings] = useState(DEFAULT_ANALYSIS_SETTINGS);

  useEffect(() => {
    let current = true;
    loadAnalysisSettings().then((loaded) => {
      if (current) setSettings(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  const update = useCallback((change: Partial<AnalysisSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...change };
      saveAnalysisSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return useMemo(() => ({ settings, update }), [settings, update]);
}

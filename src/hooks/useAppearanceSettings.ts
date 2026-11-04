import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../constants/appearance';
import {
  loadAppearanceSettings,
  saveAppearanceSettings,
} from '../network/appearanceSettingsStorage';

// Light or dark mode and the board's colors, kept on the device: the
// defaults until what was saved has loaded, then each change saved as it's
// made.
export type AppearanceSettingsState = {
  settings: AppearanceSettings;
  update: (change: Partial<AppearanceSettings>) => void;
};

export function useAppearanceSettings(): AppearanceSettingsState {
  const [settings, setSettings] = useState(DEFAULT_APPEARANCE_SETTINGS);

  useEffect(() => {
    let current = true;
    loadAppearanceSettings().then((loaded) => {
      if (current) setSettings(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  const update = useCallback((change: Partial<AppearanceSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...change };
      saveAppearanceSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return useMemo(() => ({ settings, update }), [settings, update]);
}

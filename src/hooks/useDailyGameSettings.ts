import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DailyGameSettings,
  DEFAULT_DAILY_GAME_SETTINGS,
} from '../constants/dailyGame';
import {
  loadDailyGameSettings,
  saveDailyGameSettings,
} from '../network/dailyGameSettingsStorage';

// Daily games' settings, kept on the device: the defaults until what was
// saved has loaded, then each change saved as it's made.
export type DailyGameSettingsState = {
  settings: DailyGameSettings;
  update: (change: Partial<DailyGameSettings>) => void;
};

export function useDailyGameSettings(): DailyGameSettingsState {
  const [settings, setSettings] = useState(DEFAULT_DAILY_GAME_SETTINGS);

  useEffect(() => {
    let current = true;
    loadDailyGameSettings().then((loaded) => {
      if (current) setSettings(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  const update = useCallback((change: Partial<DailyGameSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...change };
      saveDailyGameSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return useMemo(() => ({ settings, update }), [settings, update]);
}

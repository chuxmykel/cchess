import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_EXPLORER_SETTINGS,
  ExplorerSettings,
} from '../constants/explorer';
import {
  loadExplorerSettings,
  saveExplorerSettings,
} from '../network/explorerSettingsStorage';

// The opening explorer's database and filters, kept on the device: the
// defaults until what was saved has loaded (`loaded`, so nothing's asked
// of a database about to change), then each change saved as it's made.
export type ExplorerSettingsState = {
  settings: ExplorerSettings;
  loaded: boolean;
  update: (change: Partial<ExplorerSettings>) => void;
};

export function useExplorerSettings(): ExplorerSettingsState {
  const [settings, setSettings] = useState(DEFAULT_EXPLORER_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let current = true;
    loadExplorerSettings().then((saved) => {
      if (!current) return;
      setSettings(saved);
      setLoaded(true);
    });
    return () => {
      current = false;
    };
  }, []);

  const update = useCallback((change: Partial<ExplorerSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...change };
      saveExplorerSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return useMemo(
    () => ({ settings, loaded, update }),
    [settings, loaded, update],
  );
}

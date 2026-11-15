import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_TIME_CONTROL, TimeControl } from '../constants/timeControls';
import {
  loadLastTimeControl,
  saveLastTimeControl,
} from '../network/newGameSettingsStorage';

// New Game's time control, kept on the device: the default until the one
// last chosen has loaded, then each choice saved as it's made. A choice
// made before the load finishes wins over what it brings.
export function useLastTimeControl(): [
  TimeControl,
  (timeControl: TimeControl) => void,
] {
  const [timeControl, setTimeControl] = useState(DEFAULT_TIME_CONTROL);
  const chosen = useRef(false);

  useEffect(() => {
    let current = true;
    loadLastTimeControl().then((loaded) => {
      if (current && !chosen.current) setTimeControl(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  const choose = useCallback((next: TimeControl) => {
    chosen.current = true;
    setTimeControl(next);
    saveLastTimeControl(next).catch(() => {});
  }, []);

  return [timeControl, choose];
}

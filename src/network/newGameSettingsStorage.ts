import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_TIME_CONTROL,
  TIME_CONTROL_GROUPS,
  TimeControl,
} from '../constants/timeControls';

const LAST_TIME_CONTROL_KEY = 'cchess.lastTimeControl';

// The time control New Game last started with - one still offered, by its
// clock settings - or the default if there's none, it's no longer offered,
// or it can't be read.
export async function loadLastTimeControl(): Promise<TimeControl> {
  try {
    const saved = await AsyncStorage.getItem(LAST_TIME_CONTROL_KEY);
    if (!saved) return DEFAULT_TIME_CONTROL;
    const { initialSeconds, incrementSeconds } = JSON.parse(saved);
    const offered = TIME_CONTROL_GROUPS.flatMap((group) => group.options).find(
      (option) =>
        option.initialSeconds === initialSeconds &&
        option.incrementSeconds === incrementSeconds,
    );
    return offered ?? DEFAULT_TIME_CONTROL;
  } catch {
    return DEFAULT_TIME_CONTROL;
  }
}

export async function saveLastTimeControl(
  timeControl: TimeControl,
): Promise<void> {
  const { initialSeconds, incrementSeconds } = timeControl;
  await AsyncStorage.setItem(
    LAST_TIME_CONTROL_KEY,
    JSON.stringify({ initialSeconds, incrementSeconds }),
  );
}

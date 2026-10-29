import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

// How long a press is held before it starts repeating, and how often it
// repeats from then on.
export const HOLD_DELAY_MS = 400;
export const REPEAT_INTERVAL_MS = 100;

export type PressAndHoldRepeat = {
  onPress: () => void;
  onLongPress: () => void;
  onPressOut: () => void;
  delayLongPress: number;
};

// A button's press handlers for an action that keeps going while it's held:
// a tap runs it once; held, it runs again every REPEAT_INTERVAL_MS until let
// go - or until `enabled` turns false, as when there's nothing left to step
// through. Spread onto a Pressable. Each run calls `action` as it is then.
export function usePressAndHoldRepeat(
  action: () => void,
  enabled: boolean,
): PressAndHoldRepeat {
  const latestAction = useRef(action);
  useLayoutEffect(() => {
    latestAction.current = action;
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const onPress = useCallback(() => latestAction.current(), []);

  const onLongPress = useCallback(() => {
    stop();
    latestAction.current();
    timer.current = setInterval(
      () => latestAction.current(),
      REPEAT_INTERVAL_MS,
    );
  }, [stop]);

  // A Pressable that turns disabled mid-press may not report the press
  // ending.
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);
  useEffect(() => stop, [stop]);

  return {
    onPress,
    onLongPress,
    onPressOut: stop,
    delayLongPress: HOLD_DELAY_MS,
  };
}

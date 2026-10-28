import { useEffect, useRef } from 'react';
import { Animated, Easing, Keyboard, KeyboardEvent } from 'react-native';

const DEFAULT_DURATION_MS = 250;

// How much of the screen the on-screen keyboard covers - 0 while it's
// hidden - as an Animated.Value that moves in step with the keyboard.
// It's animated rather than state so following the keyboard re-renders
// nothing: a re-render can reset a natively driven animation on the same
// view, such as a bottom sheet's slide. Each time `isActive` turns on it
// re-reads where the keyboard really is - a keyboard torn down with a
// modal can leave without saying it hid.
export function useKeyboardHeight(isActive = true): Animated.Value {
  // A lazy-inited, never-reassigned Animated.Value - the standard idiom.
  // eslint-disable-next-line react-hooks/refs
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function follow(event: KeyboardEvent, toValue: number) {
      Animated.timing(height, {
        toValue,
        duration: event.duration || DEFAULT_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        // bottom/height, which this drives, can't use the native driver.
        useNativeDriver: false,
      }).start();
    }
    const subscriptions = [
      Keyboard.addListener('keyboardWillShow', (event) =>
        follow(event, event.endCoordinates.height),
      ),
      Keyboard.addListener('keyboardWillHide', (event) => follow(event, 0)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [height]);

  useEffect(() => {
    if (isActive) {
      height.setValue(
        Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0,
      );
    }
  }, [height, isActive]);

  return height;
}

import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export interface ToastBubbleAnimation {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

// Fades a toast bubble in and slides it up slightly on mount. Each
// ToastBubble is keyed by its toast id (see Toast/index.tsx), so a new
// mount - and a fresh run of this animation - is exactly what should
// happen when a new toast appears.
export function useToastBubbleAnimation(): ToastBubbleAnimation {
  // `opacity`/`translateY` are created once via useRef and never
  // reassigned - reading `.current` here is the standard "lazy-init a
  // stable Animated.Value" idiom, not a bug. react-hooks/refs is a
  // React-Compiler-readiness rule; nothing in this project runs the
  // compiler today, so revisit this if that ever changes.
  /* eslint-disable react-hooks/refs */
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return { opacity, translateY };
  /* eslint-enable react-hooks/refs */
}

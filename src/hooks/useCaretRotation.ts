import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export interface CaretRotation {
  rotateTransform: { transform: { rotate: Animated.AnimatedInterpolation<string> }[] };
  pulseDipOpacity: { opacity: Animated.AnimatedInterpolation<number> };
}

export function useCaretRotation(open: boolean): CaretRotation {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const rotateTransform = {
    transform: [
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };
  const pulseDipOpacity = {
    opacity: progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.4, 1],
    }),
  };

  return { rotateTransform, pulseDipOpacity };
}

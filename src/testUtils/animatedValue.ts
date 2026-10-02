import type { Animated } from 'react-native';

// Animated.Value's current number is intentionally not part of the public
// TS API (RN's Animated is meant to drive native animations write-only from
// JS), but __getValue() does exist at runtime and is the standard way tests
// read it back synchronously.
export function getAnimatedValue(value: Animated.Value): number {
  return (value as unknown as { __getValue(): number }).__getValue();
}

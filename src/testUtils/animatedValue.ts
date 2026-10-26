import type { Animated } from 'react-native';

import type { Position } from '../domain/types';

// Animated.Value's current number is intentionally not part of the public
// TS API (RN's Animated is meant to drive native animations write-only from
// JS), but __getValue() does exist at runtime and is the standard way tests
// read it back synchronously.
export function getAnimatedValue(value: Animated.Value): number {
  return (value as unknown as { __getValue(): number }).__getValue();
}

// The same for an Animated.ValueXY, read back as a plain {x, y} - its x/y
// are themselves Animated.Values, so this just reads each one.
export function getAnimatedXY(value: Animated.ValueXY): Position {
  return { x: getAnimatedValue(value.x), y: getAnimatedValue(value.y) };
}

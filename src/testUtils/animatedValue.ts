import type { Animated } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

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

// A Reanimated view's style as last drawn, its animated part included.
// Reanimated's types describe its web getAnimatedStyle here (no argument, no
// result), not the native one Jest actually runs, which takes the element.
export function animatedStyleOf(element: {
  props: Record<string, unknown>;
}): Record<string, any> {
  return (
    getAnimatedStyle as unknown as (component: {
      props: Record<string, unknown>;
    }) => Record<string, any>
  )(element);
}

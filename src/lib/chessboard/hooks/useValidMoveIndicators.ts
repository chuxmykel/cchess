import { useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { SQUARES } from '../constants';
import { Square } from '../types';

export type ValidMoveIndicators = {
  opacities: Record<Square, Animated.Value>;
  // Shows these squares' dots at once, without waiting on a render - a drag
  // starting - until `squares` next changes.
  showFor: (squares: Square[]) => void;
};

// Each square's move dot, shown for `squares` - the selected piece's moves.
export function useValidMoveIndicators(squares: Square[]): ValidMoveIndicators {
  // `indicatorOpacities` is created once via useRef and never reassigned -
  // reading `.current` here is the standard "lazy-init a stable value"
  // idiom, not a bug. react-hooks/refs is a React-Compiler-readiness rule;
  // nothing in this project runs the compiler today, so revisit this if
  // that ever changes.
  /* eslint-disable react-hooks/refs */
  const indicatorOpacities = useRef<Record<Square, Animated.Value>>(
    SQUARES.reduce(
      (acc, square) => {
        acc[square] = new Animated.Value(0);
        return acc;
      },
      {} as Record<Square, Animated.Value>,
    ),
  ).current;

  const showFor = useCallback(
    (shown: Square[]) => {
      SQUARES.forEach((square) => {
        indicatorOpacities[square].setValue(shown.includes(square) ? 1 : 0);
      });
    },
    [indicatorOpacities],
  );

  useEffect(() => {
    showFor(squares);
  }, [squares, showFor]);

  return { opacities: indicatorOpacities, showFor };
  /* eslint-enable react-hooks/refs */
}

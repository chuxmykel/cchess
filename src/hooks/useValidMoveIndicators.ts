import { useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Square } from 'chess.js';

import { SQUARES } from '../constants';

export type ValidMoveIndicators = {
  opacities: Record<Square, Animated.Value>;
  showFor: (square: Square) => void;
};

export function useValidMoveIndicators(
  legalMoveSquares: Square[],
  getLegalMoveSquares: (square: Square) => Square[],
): ValidMoveIndicators {
  const indicatorOpacities = useRef<Record<Square, Animated.Value>>(
    SQUARES.reduce(
      (acc, square) => {
        acc[square] = new Animated.Value(0);
        return acc;
      },
      {} as Record<Square, Animated.Value>,
    ),
  ).current;

  useEffect(() => {
    SQUARES.forEach((square) => {
      indicatorOpacities[square].setValue(
        legalMoveSquares.includes(square) ? 1 : 0,
      );
    });
  }, [legalMoveSquares, indicatorOpacities]);

  const showFor = useCallback(
    (square: Square) => {
      const legalSquares = getLegalMoveSquares(square);
      SQUARES.forEach((sq) => {
        indicatorOpacities[sq].setValue(legalSquares.includes(sq) ? 1 : 0);
      });
    },
    [getLegalMoveSquares, indicatorOpacities],
  );

  return { opacities: indicatorOpacities, showFor };
}

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Color } from 'chess.js';

import {
  EngineScore,
  evalBarFraction,
  formatScore,
} from '../../domain/evalScore';

interface EvalBarProps {
  // Null while the engine has no score for the position yet.
  score: EngineScore | null;
  // Across the board (above or below it), or beside it.
  direction?: 'horizontal' | 'vertical';
  // The side at the bottom of the board, whose end of a vertical bar its
  // share fills from.
  orientation?: Color;
}

export const EVAL_BAR_THICKNESS = 18;
const FILL_TIMING = { duration: 300 };

// How the engine sees the position: white's share of the bar - from the left
// across the board, or from white's end beside it - black's the rest, and the
// score on it. While a new position's score is coming, the last one stays,
// so stepping through moves glides from one score to the next rather than
// dropping back to even in between.
const EvalBar: React.FC<EvalBarProps> = ({
  score,
  direction = 'horizontal',
  orientation = 'w',
}) => {
  const [shown, setShown] = useState(score);
  if (score && score !== shown) setShown(score);

  const fraction = shown ? evalBarFraction(shown) : 0.5;
  const fill = useSharedValue(fraction);
  useEffect(() => {
    fill.set(withTiming(fraction, FILL_TIMING));
  }, [fill, fraction]);
  const vertical = direction === 'vertical';
  const fillStyle = useAnimatedStyle(() =>
    vertical
      ? { height: `${fill.get() * 100}%` }
      : { width: `${fill.get() * 100}%` },
  );
  const whiteAhead = fraction >= 0.5;
  // Where white's share starts.
  const whiteEnd = !vertical ? 'left' : orientation === 'w' ? 'bottom' : 'top';

  return (
    <View
      style={[styles.bar, vertical ? styles.vertical : styles.horizontal]}
      testID="eval-bar"
    >
      <Animated.View
        style={[styles.white, FILL_FROM[whiteEnd], fillStyle]}
        testID="eval-bar-fill"
      />
      {shown && (
        <Text
          style={[
            styles.score,
            vertical && styles.verticalScore,
            whiteAhead ? styles.onWhite : styles.onBlack,
            scorePosition(whiteEnd, whiteAhead),
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={vertical}
          testID="eval-bar-score"
        >
          {formatScore(shown)}
        </Text>
      )}
    </View>
  );
};

export default EvalBar;

type End = 'left' | 'bottom' | 'top';

const FILL_FROM: Record<End, object> = {
  left: { left: 0, top: 0, bottom: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  top: { top: 0, left: 0, right: 0 },
};

// The score sits at the end of the side that's ahead.
function scorePosition(whiteEnd: End, whiteAhead: boolean): object {
  const inset = 4;
  if (whiteEnd === 'left') return whiteAhead ? { left: 6 } : { right: 6 };
  const atWhiteEnd = whiteEnd === 'bottom' ? { bottom: inset } : { top: inset };
  const atBlackEnd = whiteEnd === 'bottom' ? { top: inset } : { bottom: inset };
  return whiteAhead ? atWhiteEnd : atBlackEnd;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  horizontal: {
    height: EVAL_BAR_THICKNESS,
  },
  vertical: {
    width: EVAL_BAR_THICKNESS,
    height: '100%',
  },
  white: {
    position: 'absolute',
    backgroundColor: '#f2f2f2',
  },
  score: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  verticalScore: {
    left: 0,
    right: 0,
    fontSize: 8,
    textAlign: 'center',
  },
  // In the colour that shows on the side that's ahead.
  onWhite: { color: '#222' },
  onBlack: { color: '#eee' },
});

import { StyleSheet, Text, View } from 'react-native';

import type { ReviewStyle } from '../../constants/review';
import { markOf } from '../../domain/review/marks';
import type { MoveClass } from '../../domain/review/types';
import { fontWeight, useTheme } from '../../theme';
import Icon, { IconName } from '../Icon';

// Each class of move's mark: the annotation chess players write for it
// where there is one - !!, !, ?!, ?, ?? - and a picture where there isn't.
const MARKS: Record<MoveClass, { glyph: string } | { icon: IconName }> = {
  brilliant: { glyph: '!!' },
  great: { glyph: '!' },
  best: { icon: 'star' },
  excellent: { icon: 'thumb-up' },
  good: { icon: 'check' },
  book: { icon: 'book-open-variant' },
  forced: { icon: 'arrow-right-bold' },
  inaccuracy: { glyph: '?!' },
  mistake: { glyph: '?' },
  miss: { icon: 'close' },
  blunder: { glyph: '??' },
};

export const MOVE_CLASS_NAMES: Record<MoveClass, string> = {
  brilliant: 'Brilliant',
  great: 'Great',
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  book: 'Book',
  forced: 'Forced',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  miss: 'Miss',
  blunder: 'Blunder',
};

interface MoveClassMarkProps {
  moveClass: MoveClass;
  size: number;
  // The cchess style marks only what matters, with symbols alone; classic,
  // every class.
  markStyle?: ReviewStyle;
}

// A class's mark in a style - null for one cchess leaves unmarked.
function markIn(
  moveClass: MoveClass,
  markStyle: ReviewStyle,
): { glyph: string } | { icon: IconName } | null {
  if (markStyle === 'classic') return MARKS[moveClass];
  const mark = markOf(moveClass);
  return mark ? { glyph: mark.glyph } : null;
}

export function isMarkedIn(moveClass: MoveClass, markStyle: ReviewStyle) {
  return markIn(moveClass, markStyle) !== null;
}

// The mark alone, in the color drawn on a class's circle - for a board's
// square badge, which draws the circle itself.
export const MoveClassMark: React.FC<MoveClassMarkProps> = ({
  moveClass,
  size,
  markStyle = 'classic',
}) => {
  const { colors } = useTheme();
  const mark = markIn(moveClass, markStyle);
  if (!mark) return null;
  if ('icon' in mark) {
    return (
      <Icon name={mark.icon} size={size * 0.62} color={colors.onMoveClass} />
    );
  }
  return (
    <Text
      style={[
        styles.glyph,
        {
          fontSize: size * 0.56,
          lineHeight: size * 0.7,
          color: colors.onMoveClass,
        },
      ]}
      allowFontScaling={false}
    >
      {mark.glyph}
    </Text>
  );
};

interface MoveClassIconProps extends MoveClassMarkProps {
  testID?: string;
}

// A class of move's mark on its colored circle - beside a move, in the
// review's bubble and its table of classes.
const MoveClassIcon: React.FC<MoveClassIconProps> = ({
  moveClass,
  size,
  markStyle = 'classic',
  testID,
}) => {
  const { colors } = useTheme();
  if (!isMarkedIn(moveClass, markStyle)) return null;
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.moveClass[moveClass],
        },
      ]}
      testID={testID ?? `move-class-${moveClass}`}
      accessibilityLabel={MOVE_CLASS_NAMES[moveClass]}
    >
      <MoveClassMark moveClass={moveClass} size={size} markStyle={markStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
});

export default MoveClassIcon;

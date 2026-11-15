import { StyleSheet, Text, View } from 'react-native';

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
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  miss: 'Miss',
  blunder: 'Blunder',
};

interface MoveClassMarkProps {
  moveClass: MoveClass;
  size: number;
}

// The mark alone, in the color drawn on a class's circle - for a board's
// square badge, which draws the circle itself.
export const MoveClassMark: React.FC<MoveClassMarkProps> = ({
  moveClass,
  size,
}) => {
  const { colors } = useTheme();
  const mark = MARKS[moveClass];
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
  testID,
}) => {
  const { colors } = useTheme();
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
      <MoveClassMark moveClass={moveClass} size={size} />
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

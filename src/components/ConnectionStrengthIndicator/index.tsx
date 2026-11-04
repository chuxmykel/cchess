import { View, Text, Pressable } from 'react-native';

import {
  useConnectionStrengthIndicator,
  BAR_COUNT,
} from '../../hooks/useConnectionStrengthIndicator';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { makeStyles } from '../../theme';

const ConnectionStrengthIndicator: React.FC = () => {
  const styles = useStyles();

  const {
    litBars,
    label,
    popover: { triggerRef, visible, position, open, close },
  } = useConnectionStrengthIndicator();

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={styles.container}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        testID="connection-strength-indicator"
      >
        <View style={styles.bars}>
          {Array.from({ length: BAR_COUNT }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                { height: 4 + index * 4 },
                index < litBars ? styles.barLit : styles.barDim,
              ]}
            />
          ))}
        </View>
      </Pressable>

      <Popover
        visible={visible}
        position={position}
        onClose={close}
        caretSide="left"
        contentStyle={styles.popoverContent}
        testID="connection-strength-popover"
        overlayTestID="connection-strength-popover-overlay"
      >
        <Text style={styles.popoverText}>{label}</Text>
      </Popover>
    </>
  );
};

export default ConnectionStrengthIndicator;

const useStyles = makeStyles((t) => ({
  container: {
    padding: t.spacing.xs,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.spacing.xxs,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  barLit: {
    backgroundColor: t.colors.success,
  },
  barDim: {
    backgroundColor: t.colors.textSecondary,
  },
  popoverContent: {
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
  popoverText: {
    fontSize: t.fontSize.md,
    color: t.colors.text,
  },
}));

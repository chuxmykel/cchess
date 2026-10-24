import { View, Text, Pressable, StyleSheet } from 'react-native';

import {
  useConnectionStrengthIndicator,
  BAR_COUNT,
} from '../../hooks/useConnectionStrengthIndicator';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';

const ConnectionStrengthIndicator: React.FC = () => {
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

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  barLit: {
    backgroundColor: '#4CAF50',
  },
  barDim: {
    backgroundColor: '#444',
  },
  popoverContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  popoverText: {
    fontSize: 13,
    color: '#333',
  },
});

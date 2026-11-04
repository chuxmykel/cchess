import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';

export type RadioOption<Key extends string> = { key: Key; label: string };

interface RadioRowProps<Key extends string> {
  options: RadioOption<Key>[];
  selected: Key;
  onSelect: (key: Key) => void;
  // Each option's testID is this, then its key.
  testIDPrefix: string;
}

// One choice of a few, as radio buttons in a row, each labelled.
function RadioRow<Key extends string>({
  options,
  selected,
  onSelect,
  testIDPrefix,
}: RadioRowProps<Key>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map(({ key, label }) => {
        const isSelected = key === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={styles.option}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            testID={`${testIDPrefix}${key}`}
          >
            <Icon
              name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={isSelected ? ACCENT_COLOR : MUTED_COLOR}
            />
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default RadioRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 15,
    color: '#444',
  },
  selectedLabel: {
    color: '#222',
    fontWeight: '600',
  },
});

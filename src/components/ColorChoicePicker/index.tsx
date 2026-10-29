import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import { PIECES } from '../../constants';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { ColorChoice } from '../../network/socketEvents';

interface ColorChoicePickerProps {
  selected: ColorChoice;
  onSelect: (color: ColorChoice) => void;
}

const CHOICES: { color: ColorChoice; label: string }[] = [
  { color: 'white', label: 'White' },
  { color: 'random', label: 'Random' },
  { color: 'black', label: 'Black' },
];

const ICON_SIZE = 28;

// Which color to play: white, black, or let chance decide.
const ColorChoicePicker: React.FC<ColorChoicePickerProps> = ({
  selected,
  onSelect,
}) => (
  <View style={styles.row} accessibilityRole="radiogroup">
    {CHOICES.map(({ color, label }) => {
      const isSelected = color === selected;
      return (
        <Pressable
          key={color}
          style={[styles.option, isSelected && styles.selected]}
          onPress={() => onSelect(color)}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`Play ${label.toLowerCase()}`}
          testID={`color-${color}`}
        >
          {color === 'random' ? (
            <Icon
              name="shuffle-variant"
              size={ICON_SIZE - 4}
              color={isSelected ? ACCENT_COLOR : MUTED_COLOR}
            />
          ) : (
            <Image
              source={PIECES[color === 'white' ? 'wk' : 'bk']}
              style={styles.king}
            />
          )}
          <Text style={[styles.label, isSelected && styles.selectedLabel]}>
            {label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default ColorChoicePicker;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e2e2',
    backgroundColor: '#f7f7f7',
  },
  selected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: '#eef4e8',
  },
  king: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  label: {
    fontSize: 13,
    color: MUTED_COLOR,
  },
  selectedLabel: {
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
});

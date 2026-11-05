import { Pressable, Text, View } from 'react-native';

import Icon from '../Icon';
import { BoardPieceIcon } from '../Board';
import { ColorChoice } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

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
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
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
                color={
                  isSelected
                    ? colors.pieceChoiceLabelSelected
                    : colors.pieceChoiceLabel
                }
              />
            ) : (
              <BoardPieceIcon
                color={color === 'white' ? 'w' : 'b'}
                type="k"
                size={ICON_SIZE}
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
};

export default ColorChoicePicker;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingVertical: t.spacing.md,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.divider,
    backgroundColor: t.colors.pieceChoice,
  },
  selected: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.pieceChoiceSelected,
  },
  label: {
    fontSize: t.fontSize.md,
    color: t.colors.pieceChoiceLabel,
  },
  selectedLabel: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.pieceChoiceLabelSelected,
  },
}));

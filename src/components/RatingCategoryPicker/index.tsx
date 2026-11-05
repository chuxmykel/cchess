import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { makeStyles, useTheme } from '../../theme';

interface RatingCategoryPickerProps {
  category: GameType;
  onSelect: (category: GameType) => void;
}

const CATEGORIES: GameType[] = [
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'daily',
];
const MENU_WIDTH = 180;

/** The rating stats header's title: the category shown, opening a
 * dropdown of the others to switch to. */
const RatingCategoryPicker: React.FC<RatingCategoryPickerProps> = ({
  category,
  onSelect,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const { triggerRef, visible, position, open, close } =
    usePopoverMenu(MENU_WIDTH);
  const { width: windowWidth } = useWindowDimensions();
  // Just below the title, but centered on the screen like the title itself,
  // rather than hanging off the trigger's right edge.
  const centeredPosition = position && {
    top: position.top,
    left: (windowWidth - MENU_WIDTH) / 2,
  };

  function select(selected: GameType) {
    close();
    if (selected !== category) onSelect(selected);
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={styles.trigger}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        accessibilityRole="button"
        accessibilityHint="Switches to another category"
        testID="rating-category-picker"
      >
        <GameTypeIcon type={category} />
        <Text style={styles.title}>{GAME_TYPE_LABELS[category]} rating</Text>
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Popover
        visible={visible}
        position={centeredPosition}
        onClose={close}
        width={MENU_WIDTH}
        contentStyle={styles.menu}
        testID="rating-category-menu"
      >
        {CATEGORIES.map((each) => {
          const isSelected = each === category;
          return (
            <Pressable
              key={each}
              style={styles.option}
              onPress={() => select(each)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
              testID={`rating-category-${each}`}
            >
              <GameTypeIcon type={each} />
              <Text
                style={[styles.optionLabel, isSelected && styles.selectedLabel]}
              >
                {GAME_TYPE_LABELS[each]}
              </Text>
              {isSelected && (
                <Icon name="check" size={18} color={colors.accent} />
              )}
            </Pressable>
          );
        })}
      </Popover>
    </>
  );
};

export default RatingCategoryPicker;

const useStyles = makeStyles((t) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
  },
  // A visible edge and a lift off the page, so it reads as a dropdown -
  // safe here, since this popover has no caret for an edge to cross.
  menu: {
    paddingVertical: t.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  optionLabel: {
    color: t.colors.text,
    flex: 1,
    fontSize: t.fontSize.lg,
  },
  selectedLabel: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
}));

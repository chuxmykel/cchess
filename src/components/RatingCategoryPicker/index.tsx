import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';

interface RatingCategoryPickerProps {
  category: GameType;
  onSelect: (category: GameType) => void;
}

const CATEGORIES: GameType[] = ['bullet', 'blitz', 'rapid', 'classical'];
const MENU_WIDTH = 180;

/** The rating stats header's title: the category shown, opening a
 * dropdown of the others to switch to. */
const RatingCategoryPicker: React.FC<RatingCategoryPickerProps> = ({
  category,
  onSelect,
}) => {
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
        <Icon name="chevron-down" size={18} color={MUTED_COLOR} />
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
                <Icon name="check" size={18} color={ACCENT_COLOR} />
              )}
            </Pressable>
          );
        })}
      </Popover>
    </>
  );
};

export default RatingCategoryPicker;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  // A visible edge and a lift off the page, so it reads as a dropdown -
  // safe here, since this popover has no caret for an edge to cross.
  menu: {
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cfcfcf',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
  selectedLabel: {
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
});

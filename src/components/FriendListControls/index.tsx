import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { FRIEND_SORTS, FriendSort } from '../../utils/friendSort';

const MENU_WIDTH = 200;

interface FriendListControlsProps {
  sort: FriendSort;
  onSortChange: (sort: FriendSort) => void;
  onlineOnly: boolean;
  onOnlineOnlyChange: (onlineOnly: boolean) => void;
  /** How many are online, shown on the filter. */
  onlineCount: number;
}

// Above a friends list: an "Online" filter and a dropdown of the orders.
const FriendListControls: React.FC<FriendListControlsProps> = ({
  sort,
  onSortChange,
  onlineOnly,
  onOnlineOnlyChange,
  onlineCount,
}) => {
  const { triggerRef, visible, position, open, close } =
    usePopoverMenu(MENU_WIDTH);
  const sortLabel = FRIEND_SORTS.find((each) => each.key === sort)?.label;

  function select(selected: FriendSort) {
    close();
    onSortChange(selected);
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.chip, onlineOnly && styles.chipSelected]}
        onPress={() => onOnlineOnlyChange(!onlineOnly)}
        accessibilityRole="button"
        accessibilityState={{ selected: onlineOnly }}
        testID="friends-online-filter"
      >
        <View style={styles.onlineDot} />
        <Text
          style={[styles.chipLabel, onlineOnly && styles.chipLabelSelected]}
        >
          Online {onlineCount}
        </Text>
        {onlineOnly && <Icon name="close" size={14} color={ACCENT_COLOR} />}
      </Pressable>

      <Pressable
        ref={triggerRef}
        style={styles.sortTrigger}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={`Sort: ${sortLabel}`}
        testID="friends-sort"
      >
        <Icon name="sort" size={18} color={MUTED_COLOR} />
        <Text style={styles.sortLabel}>{sortLabel}</Text>
        <Icon name="chevron-down" size={16} color={MUTED_COLOR} />
      </Pressable>
      <Popover
        visible={visible}
        position={position}
        onClose={close}
        width={MENU_WIDTH}
        contentStyle={styles.menu}
        testID="friends-sort-menu"
      >
        {FRIEND_SORTS.map((each) => {
          const isSelected = each.key === sort;
          return (
            <Pressable
              key={each.key}
              style={styles.option}
              onPress={() => select(each.key)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
              testID={`friends-sort-${each.key}`}
            >
              <Text
                style={[styles.optionLabel, isSelected && styles.selectedLabel]}
              >
                {each.label}
              </Text>
              {isSelected && (
                <Icon name="check" size={18} color={ACCENT_COLOR} />
              )}
            </Pressable>
          );
        })}
      </Popover>
    </View>
  );
};

export default FriendListControls;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c8c8',
  },
  chipSelected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: '#eef4e8',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_COLOR,
  },
  chipLabel: {
    fontSize: 14,
  },
  chipLabelSelected: {
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 14,
    color: MUTED_COLOR,
  },
  // A visible edge and a lift off the page, like the rating category
  // dropdown.
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

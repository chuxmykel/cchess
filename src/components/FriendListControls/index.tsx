import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { FRIEND_SORTS, FriendSort } from '../../utils/friendSort';
import { makeStyles, useTheme } from '../../theme';

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
  const styles = useStyles();
  const { colors } = useTheme();

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
        {onlineOnly && <Icon name="close" size={14} color={colors.accent} />}
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
        <Icon name="sort" size={18} color={colors.textMuted} />
        <Text style={styles.sortLabel}>{sortLabel}</Text>
        <Icon name="chevron-down" size={16} color={colors.textMuted} />
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
                <Icon name="check" size={18} color={colors.accent} />
              )}
            </Pressable>
          );
        })}
      </Popover>
    </View>
  );
};

export default FriendListControls;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.separator,
  },
  chipSelected: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.accentSubtle,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.accent,
  },
  chipLabel: {
    fontSize: t.fontSize.base,
  },
  chipLabelSelected: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  sortLabel: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
  // A visible edge and a lift off the page, like the rating category
  // dropdown.
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
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: t.fontSize.lg,
  },
  selectedLabel: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
}));

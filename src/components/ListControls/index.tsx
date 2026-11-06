import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { makeStyles, useTheme } from '../../theme';

const MENU_WIDTH = 200;

interface ListControlsProps<Sort extends string> {
  /** A chip that narrows the list, on or off. */
  filter: {
    label: string;
    selected: boolean;
    onChange: (selected: boolean) => void;
    /** Drawn before its label - a dot, say. */
    leading?: ReactNode;
    testID: string;
  };
  sorts: { key: Sort; label: string }[];
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  /** The sort's dropdown is `<testID>-sort`, its menu `<testID>-sort-menu`
   * and each order `<testID>-sort-<key>`. */
  testID: string;
}

// Above a list: a filter chip, and a dropdown of the orders it can be in.
function ListControls<Sort extends string>({
  filter,
  sorts,
  sort,
  onSortChange,
  testID,
}: ListControlsProps<Sort>) {
  const styles = useStyles();
  const { colors } = useTheme();

  const { triggerRef, visible, position, open, close } =
    usePopoverMenu(MENU_WIDTH);
  const sortLabel = sorts.find((each) => each.key === sort)?.label;

  function select(selected: Sort) {
    close();
    onSortChange(selected);
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.chip, filter.selected && styles.chipSelected]}
        onPress={() => filter.onChange(!filter.selected)}
        accessibilityRole="button"
        accessibilityState={{ selected: filter.selected }}
        testID={filter.testID}
      >
        {filter.leading}
        <Text
          style={[
            styles.chipLabel,
            filter.selected && styles.chipLabelSelected,
          ]}
        >
          {filter.label}
        </Text>
        {filter.selected && (
          <Icon name="close" size={14} color={colors.accent} />
        )}
      </Pressable>

      <Pressable
        ref={triggerRef}
        style={styles.sortTrigger}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={`Sort: ${sortLabel}`}
        testID={`${testID}-sort`}
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
        testID={`${testID}-sort-menu`}
      >
        {sorts.map((each) => {
          const isSelected = each.key === sort;
          return (
            <Pressable
              key={each.key}
              style={styles.option}
              onPress={() => select(each.key)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
              testID={`${testID}-sort-${each.key}`}
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
}

export default ListControls;

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
  chipLabel: {
    color: t.colors.text,
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
    color: t.colors.text,
    flex: 1,
    fontSize: t.fontSize.lg,
  },
  selectedLabel: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
}));

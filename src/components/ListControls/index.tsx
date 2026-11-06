import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Dropdown from '../Dropdown';
import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

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

      <Dropdown
        options={sorts}
        value={sort}
        onChange={onSortChange}
        icon="sort"
        accessibilityName="Sort"
        testID={`${testID}-sort`}
      />
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
}));

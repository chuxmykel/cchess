import { Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles } from '../../theme';

export type SegmentedTab<Key extends string> = { key: Key; label: string };

interface SegmentedTabsProps<Key extends string> {
  tabs: SegmentedTab<Key>[];
  selected: Key;
  onSelect: (key: Key) => void;
}

function SegmentedTabs<Key extends string>({
  tabs,
  selected,
  onSelect,
}: SegmentedTabsProps<Key>) {
  const styles = useStyles();

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isSelected = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isSelected && styles.selected]}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedTabs;

const useStyles = makeStyles((t) => ({
  container: {
    flexDirection: 'row',
    marginHorizontal: t.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.separator,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selected: {
    borderBottomColor: t.colors.accent,
  },
  label: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
  selectedLabel: {
    color: t.colors.accent,
    fontWeight: t.fontWeight.semibold,
  },
}));

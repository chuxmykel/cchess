import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';

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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c8c8c8',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selected: {
    borderBottomColor: ACCENT_COLOR,
  },
  label: {
    fontSize: 14,
    color: MUTED_COLOR,
  },
  selectedLabel: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
});

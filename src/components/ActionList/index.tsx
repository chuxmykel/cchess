import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon, { IconName } from '../Icon';

export type ActionListItem = {
  label: string;
  icon: IconName;
  /** Leave out for a row that only shows information. */
  onPress?: () => void;
  destructive?: boolean;
  testID?: string;
};

const ActionList: React.FC<{ items: ActionListItem[] }> = ({ items }) => (
  <View style={styles.card}>
    {items.map((item, index) => (
      <Fragment key={item.label}>
        {index > 0 && <View style={styles.divider} />}
        <Pressable
          style={({ pressed }) => [
            styles.row,
            pressed && item.onPress && styles.pressed,
          ]}
          onPress={item.onPress}
          disabled={!item.onPress}
          accessibilityRole={item.onPress ? 'button' : 'text'}
          testID={item.testID}
        >
          <Icon
            name={item.icon}
            size={22}
            color={item.destructive ? '#d33' : '#444'}
          />
          <Text style={[styles.label, item.destructive && styles.destructive]}>
            {item.label}
          </Text>
        </Pressable>
      </Fragment>
    ))}
  </View>
);

export default ActionList;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
  },
  destructive: {
    color: '#d33',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginLeft: 52,
  },
});

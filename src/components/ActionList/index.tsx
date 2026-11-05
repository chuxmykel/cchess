import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon, { IconName } from '../Icon';
import { makeStyles, useTheme } from '../../theme';

export type ActionListItem = {
  label: string;
  icon: IconName;
  /** Leave out for a row that only shows information. */
  onPress?: () => void;
  destructive?: boolean;
  /** Shown greyed out, and can't be pressed. */
  disabled?: boolean;
  testID?: string;
};

const ActionList: React.FC<{ items: ActionListItem[] }> = ({ items }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const isPressable = Boolean(item.onPress) && !item.disabled;
        return (
          <Fragment key={item.label}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && isPressable && styles.pressed,
                item.disabled && styles.disabled,
              ]}
              onPress={item.onPress}
              disabled={!isPressable}
              accessibilityRole={item.onPress ? 'button' : 'text'}
              accessibilityState={{ disabled: Boolean(item.disabled) }}
              testID={item.testID}
            >
              <Icon
                name={item.icon}
                size={22}
                color={item.destructive ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[styles.label, item.destructive && styles.destructive]}
              >
                {item.label}
              </Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
};

export default ActionList;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  destructive: {
    color: t.colors.danger,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginLeft: 52,
  },
}));

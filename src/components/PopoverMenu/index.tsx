import {
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { useRunAfterDismiss } from '../../hooks/useRunAfterDismiss';
import Icon, { IconName } from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { fontSize, spacing, useTheme } from '../../theme';

const DEFAULT_MENU_WIDTH = 160;

export interface PopoverMenuItem {
  label: string;
  icon?: IconName;
  onPress: () => void;
  testID?: string;
}

interface PopoverMenuProps {
  items: PopoverMenuItem[];
  triggerIcon?: IconName;
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PopoverMenu: React.FC<PopoverMenuProps> = ({
  items,
  triggerIcon = 'dots-vertical',
  width = DEFAULT_MENU_WIDTH,
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const { triggerRef, visible, position, open, close } = usePopoverMenu(width);
  const { runAfterDismiss, handleDismiss } = useRunAfterDismiss();

  function selectItem(item: PopoverMenuItem) {
    close();
    runAfterDismiss(item.onPress);
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={[styles.trigger, style]}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        testID={testID}
      >
        <Icon
          name={triggerIcon}
          size={20}
          color={colors.textSecondary}
          testID="popover-menu-trigger-icon"
        />
      </Pressable>
      <Popover
        visible={visible}
        position={position}
        onClose={close}
        onDismiss={handleDismiss}
        width={width}
        contentStyle={styles.menuContent}
      >
        {items.map((item) => (
          <Pressable
            key={item.label}
            style={styles.menuItem}
            onPress={() => selectItem(item)}
            testID={item.testID}
          >
            <Text style={styles.menuItemText}>{item.label}</Text>
            {item.icon && (
              <Icon
                name={item.icon}
                size={18}
                color={colors.textSecondary}
                testID="popover-menu-item-icon"
              />
            )}
          </Pressable>
        ))}
      </Popover>
    </>
  );
};

export default PopoverMenu;

const styles = StyleSheet.create({
  trigger: {
    padding: spacing.xs,
  },
  menuContent: {
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemText: {
    fontSize: fontSize.lg,
  },
});

import {
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { useRunAfterDismiss } from '../../hooks/useRunAfterDismiss';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';

const DEFAULT_MENU_WIDTH = 160;

export interface PopoverMenuItem {
  label: string;
  icon?: string;
  onPress: () => void;
  testID?: string;
}

interface PopoverMenuProps {
  items: PopoverMenuItem[];
  triggerLabel?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PopoverMenu: React.FC<PopoverMenuProps> = ({
  items,
  triggerLabel = '⋮',
  width = DEFAULT_MENU_WIDTH,
  style,
  testID,
}) => {
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
        <Text style={styles.triggerText}>{triggerLabel}</Text>
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
            {item.icon && <Text style={styles.menuItemIcon}>{item.icon}</Text>}
          </Pressable>
        ))}
      </Popover>
    </>
  );
};

export default PopoverMenu;

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  triggerText: {
    fontSize: 16,
    color: '#666',
  },
  menuContent: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
  },
  menuItemIcon: {
    fontSize: 15,
    color: '#666',
  },
});

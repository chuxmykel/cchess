import {
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';

const MENU_WIDTH = 160;

interface PopoverMenuProps {
  items: string[];
  onSelectItem: (item: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PopoverMenu: React.FC<PopoverMenuProps> = ({
  items,
  onSelectItem,
  style,
  testID,
}) => {
  const { triggerRef, visible, position, open, close } =
    usePopoverMenu(MENU_WIDTH);

  function selectItem(item: string) {
    close();
    onSelectItem(item);
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
        <Text style={styles.triggerText}>{'⋮'}</Text>
      </Pressable>
      <Popover
        visible={visible}
        position={position}
        onClose={close}
        width={MENU_WIDTH}
        contentStyle={styles.menuContent}
      >
        {items.map((item) => (
          <Pressable
            key={item}
            style={styles.menuItem}
            onPress={() => selectItem(item)}
          >
            <Text style={styles.menuItemText}>{item}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
  },
});

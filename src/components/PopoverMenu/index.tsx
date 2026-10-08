import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { usePopoverMenu } from '../../hooks/usePopoverMenu';

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
        hitSlop={8}
        testID={testID}
      >
        <Text style={styles.triggerText}>{'⋮'}</Text>
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.overlay} onPress={close}>
          <View
            style={[
              styles.menu,
              position && { top: position.top, left: position.left },
            ]}
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
          </View>
        </Pressable>
      </Modal>
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
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
  },
});

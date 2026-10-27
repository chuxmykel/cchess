import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
} from 'react-native';

import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { MenuPosition, SCREEN_EDGE_MARGIN } from '../../hooks/usePopoverMenu';
import { MUTED_COLOR } from '../../constants/colors';

interface NotificationsMenuProps {
  /** Shown on the bell's badge: what's waiting for an answer. */
  count: number;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** The notifications; leave empty for none. */
  children: React.ReactNode;
  isEmpty: boolean;
}

const MAX_BADGE_COUNT = 9;
const GAP_BELOW_BELL = 6;
const MAX_HEIGHT = 420;

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  count,
  visible,
  onOpen,
  onClose,
  children,
  isEmpty,
}) => {
  const bellRef = useRef<ViewInstance>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  // Measured ahead of time, so the popup opens in place on the first tap.
  function measureBell() {
    bellRef.current?.measureInWindow((_x, y, _width, height) => {
      setPosition({
        top: y + height + GAP_BELOW_BELL,
        left: SCREEN_EDGE_MARGIN,
      });
    });
  }

  return (
    <>
      <Pressable
        ref={bellRef}
        style={styles.bell}
        onLayout={measureBell}
        onPress={onOpen}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        testID="notifications-button"
      >
        <Icon name="bell-outline" size={26} color="#333" />
        {count > 0 && (
          <View style={styles.badge} testID="notifications-badge">
            <Text style={styles.badgeText}>
              {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
            </Text>
          </View>
        )}
      </Pressable>
      <Popover
        visible={visible}
        position={position}
        onClose={onClose}
        width={windowWidth - SCREEN_EDGE_MARGIN * 2}
        contentStyle={styles.content}
        testID="notifications-menu"
      >
        <Text style={styles.title}>Notifications</Text>
        {isEmpty ? (
          <Text style={styles.empty} testID="notifications-empty">
            No new notifications
          </Text>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {children}
          </ScrollView>
        )}
      </Popover>
    </>
  );
};

export default NotificationsMenu;

const styles = StyleSheet.create({
  bell: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#d33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    maxHeight: MAX_HEIGHT,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  empty: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
});

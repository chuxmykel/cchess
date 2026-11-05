import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
} from 'react-native';

import EmptyState from '../EmptyState';
import Icon from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { MenuPosition, SCREEN_EDGE_MARGIN } from '../../hooks/usePopoverMenu';
import { makeStyles, useTheme } from '../../theme';

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
  const styles = useStyles();
  const { colors } = useTheme();

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
        <Icon name="bell-outline" size={26} color={colors.text} />
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
          <EmptyState
            illustration="notifications"
            title="You're all caught up"
            message="Challenges and friend requests will show up here."
            compact
            testID="notifications-empty"
          />
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

const useStyles = makeStyles((t) => ({
  bell: {
    padding: t.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: t.spacing.xs,
    borderRadius: 9,
    backgroundColor: t.colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.bold,
  },
  content: {
    paddingVertical: t.spacing.md,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  title: {
    color: t.colors.text,
    paddingHorizontal: t.spacing.md,
    marginBottom: t.spacing.sm,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
  },
  list: {
    maxHeight: MAX_HEIGHT,
  },
  listContent: {
    paddingHorizontal: t.spacing.md,
    gap: t.spacing.sm,
  },
}));

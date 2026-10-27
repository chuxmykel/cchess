import { View, Text, Pressable, StyleSheet } from 'react-native';

import Icon, { IconName } from '../Icon';

const ICON_SIZE = 28;
const ENABLED_COLOR = '#333';
const DISABLED_COLOR = '#c4c4c4';
const MAX_BADGE_COUNT = 9;

interface GameToolbarProps {
  onOpenMenu: () => void;
  onResign: () => void;
  canResign: boolean;
  onOpenChat: () => void;
  unreadChatCount: number;
  onPreviousMove: () => void;
  onNextMove: () => void;
  canGoToPreviousMove: boolean;
  canGoToNextMove: boolean;
}

interface ToolbarButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  badgeCount?: number;
  testID: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
  badgeCount = 0,
  testID,
}) => (
  <Pressable
    style={styles.button}
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    testID={testID}
  >
    <Icon
      name={icon}
      size={ICON_SIZE}
      color={disabled ? DISABLED_COLOR : ENABLED_COLOR}
    />
    {badgeCount > 0 && (
      <View style={styles.badge} testID={`${testID}-badge`}>
        <Text style={styles.badgeText}>
          {badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : badgeCount}
        </Text>
      </View>
    )}
  </Pressable>
);

const GameToolbar: React.FC<GameToolbarProps> = ({
  onOpenMenu,
  onResign,
  canResign,
  onOpenChat,
  unreadChatCount,
  onPreviousMove,
  onNextMove,
  canGoToPreviousMove,
  canGoToNextMove,
}) => (
  <View style={styles.container} testID="game-toolbar">
    <ToolbarButton
      icon="menu"
      label="Game menu"
      onPress={onOpenMenu}
      testID="game-menu-button"
    />
    <ToolbarButton
      icon="flag-variant-outline"
      label="Resign"
      onPress={onResign}
      disabled={!canResign}
      testID="toolbar-resign-button"
    />
    <ToolbarButton
      icon="chat-outline"
      label={unreadChatCount > 0 ? `Chat, ${unreadChatCount} unread` : 'Chat'}
      onPress={onOpenChat}
      badgeCount={unreadChatCount}
      testID="chat-button"
    />
    <ToolbarButton
      icon="chevron-left"
      label="Previous move"
      onPress={onPreviousMove}
      disabled={!canGoToPreviousMove}
      testID="previous-move-button"
    />
    <ToolbarButton
      icon="chevron-right"
      label="Next move"
      onPress={onNextMove}
      disabled={!canGoToNextMove}
      testID="next-move-button"
    />
  </View>
);

export default GameToolbar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
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
});

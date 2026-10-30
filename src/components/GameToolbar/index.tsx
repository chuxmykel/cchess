import { View, Text, Pressable, StyleSheet } from 'react-native';

import Icon, { IconName } from '../Icon';
import { MoveNavigation } from '../../hooks/useMoveNavigation';
import { usePressAndHoldRepeat } from '../../hooks/usePressAndHoldRepeat';

const ICON_SIZE = 28;
const ENABLED_COLOR = '#333';
const DISABLED_COLOR = '#c4c4c4';
const MAX_BADGE_COUNT = 9;

/** Stepping back and forward through a game's moves. */
export type MoveSteps = Pick<
  MoveNavigation,
  'back' | 'forward' | 'canGoBack' | 'canGoForward'
>;

interface GameToolbarProps {
  onOpenMenu: () => void;
  /** Leave out to hide the resign button, e.g. when watching. */
  onResign?: () => void;
  canResign?: boolean;
  /** Leave out to hide the chat button. */
  onOpenChat?: () => void;
  unreadChatCount?: number;
  moveSteps: MoveSteps;
}

interface ToolbarButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  badgeCount?: number;
  // Held down, it presses again and again, until let go.
  repeatsWhileHeld?: boolean;
  testID: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
  badgeCount = 0,
  repeatsWhileHeld = false,
  testID,
}) => {
  const repeating = usePressAndHoldRepeat(onPress, !disabled);
  return (
    <Pressable
      style={styles.button}
      {...(repeatsWhileHeld ? repeating : { onPress })}
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
};

const GameToolbar: React.FC<GameToolbarProps> = ({
  onOpenMenu,
  onResign,
  canResign = false,
  onOpenChat,
  unreadChatCount = 0,
  moveSteps,
}) => (
  <View style={styles.container} testID="game-toolbar">
    <ToolbarButton
      icon="menu"
      label="Game menu"
      onPress={onOpenMenu}
      testID="game-menu-button"
    />
    {onResign && (
      <ToolbarButton
        icon="flag-variant-outline"
        label="Resign"
        onPress={onResign}
        disabled={!canResign}
        testID="toolbar-resign-button"
      />
    )}
    {onOpenChat && (
      <ToolbarButton
        icon="chat-outline"
        label={unreadChatCount > 0 ? `Chat, ${unreadChatCount} unread` : 'Chat'}
        onPress={onOpenChat}
        badgeCount={unreadChatCount}
        testID="chat-button"
      />
    )}
    <ToolbarButton
      icon="chevron-left"
      label="Previous move"
      onPress={moveSteps.back}
      disabled={!moveSteps.canGoBack}
      repeatsWhileHeld
      testID="previous-move-button"
    />
    <ToolbarButton
      icon="chevron-right"
      label="Next move"
      onPress={moveSteps.forward}
      disabled={!moveSteps.canGoForward}
      repeatsWhileHeld
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

import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  type ViewInstance,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import Icon, { IconName } from '../Icon';
import ToolbarTooltip, { tooltipShift } from './ToolbarTooltip';
import { MoveNavigation } from '../../hooks/useMoveNavigation';
import { usePressAndHoldRepeat } from '../../hooks/usePressAndHoldRepeat';
import { makeStyles, useTheme } from '../../theme';

const ICON_SIZE = 28;
const MAX_BADGE_COUNT = 9;
// How long a button is held before its tooltip shows.
export const TOOLTIP_DELAY_MS = 350;

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
  /** Leave out to hide the analysis button. */
  onAnalyse?: () => void;
  moveSteps: MoveSteps;
}

interface ToolbarButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  badgeCount?: number;
  // What the button does, shown while it's held - the label when left out.
  hint?: string;
  // Held down, it presses again and again, until let go - so it has no
  // tooltip.
  repeatsWhileHeld?: boolean;
  testID: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
  badgeCount = 0,
  hint,
  repeatsWhileHeld = false,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const repeating = usePressAndHoldRepeat(onPress, !disabled);
  const button = useRef<ViewInstance>(null);
  const screen = useWindowDimensions();
  // Held long enough to show what it does; let go, it goes - and the press
  // that showed it doesn't count.
  const [isTooltipShown, setIsTooltipShown] = useState(false);
  const [tooltipOffset, setTooltipOffset] = useState<number | null>(null);
  const tooltipHandlers = {
    onPress,
    onLongPress: () => {
      setIsTooltipShown(true);
      // Felt as the tooltip shows, as iOS does for a long press.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    delayLongPress: TOOLTIP_DELAY_MS,
    onPressOut: () => {
      setIsTooltipShown(false);
      setTooltipOffset(null);
    },
  };
  // Where the button is on screen, once the bubble's width is known.
  const placeTooltip = (width: number) =>
    button.current?.measureInWindow((x, _y, buttonWidth) =>
      setTooltipOffset(tooltipShift(x, buttonWidth, width, screen.width)),
    );
  return (
    <Pressable
      ref={button}
      style={styles.button}
      {...(repeatsWhileHeld ? repeating : tooltipHandlers)}
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
        color={disabled ? colors.disabled : colors.text}
      />
      {badgeCount > 0 && (
        <View style={styles.badge} testID={`${testID}-badge`}>
          <Text style={styles.badgeText}>
            {badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : badgeCount}
          </Text>
        </View>
      )}
      {isTooltipShown && (
        <ToolbarTooltip
          text={hint ?? label}
          shift={tooltipOffset}
          onMeasured={placeTooltip}
        />
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
  onAnalyse,
  moveSteps,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.container} testID="game-toolbar">
      <ToolbarButton
        icon="menu"
        label="Menu"
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
          label={
            unreadChatCount > 0 ? `Chat, ${unreadChatCount} unread` : 'Chat'
          }
          onPress={onOpenChat}
          badgeCount={unreadChatCount}
          testID="chat-button"
        />
      )}
      {onAnalyse && (
        <ToolbarButton
          icon="magnify"
          label="Analysis"
          onPress={onAnalyse}
          testID="toolbar-analysis-button"
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
};

export default GameToolbar;

const useStyles = makeStyles((t) => ({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
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
}));

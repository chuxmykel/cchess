import { View, Pressable, StyleSheet } from 'react-native';

import Icon, { IconName } from '../Icon';

const ICON_SIZE = 28;
const ENABLED_COLOR = '#333';
const DISABLED_COLOR = '#c4c4c4';

interface GameToolbarProps {
  onOpenMenu: () => void;
  onResign: () => void;
  canResign: boolean;
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
  testID: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
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
  </Pressable>
);

const GameToolbar: React.FC<GameToolbarProps> = ({
  onOpenMenu,
  onResign,
  canResign,
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
});

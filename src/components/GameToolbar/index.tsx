import { View, Text, Pressable, StyleSheet } from 'react-native';

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
  glyph: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  glyph,
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
    <Text style={[styles.glyph, disabled && styles.disabled]}>{glyph}</Text>
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
      glyph="☰"
      label="Game menu"
      onPress={onOpenMenu}
      testID="game-menu-button"
    />
    <ToolbarButton
      glyph="⚑"
      label="Resign"
      onPress={onResign}
      disabled={!canResign}
      testID="toolbar-resign-button"
    />
    <ToolbarButton
      glyph="‹"
      label="Previous move"
      onPress={onPreviousMove}
      disabled={!canGoToPreviousMove}
      testID="previous-move-button"
    />
    <ToolbarButton
      glyph="›"
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
  glyph: {
    fontSize: 24,
    color: '#333',
  },
  disabled: {
    color: '#c4c4c4',
  },
});

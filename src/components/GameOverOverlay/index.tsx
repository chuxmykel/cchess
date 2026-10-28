import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface GameOverOverlayProps {
  /** Puts the result away - as the card's ✕ does. */
  onDismiss: () => void;
  /** The result card. */
  children: ReactNode;
}

// The faded board behind the game-over card: tapping it puts the card
// away, like tapping any popup's backdrop.
const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  onDismiss,
  children,
}) => (
  <Pressable
    style={styles.overlay}
    onPress={onDismiss}
    // Not a button to screen readers, which would hide the card's own
    // inside it - they close it with the card's ✕.
    accessible={false}
    testID="game-over-overlay"
  >
    {/* Claims its own touches, so a tap on the card doesn't close it. */}
    <View onStartShouldSetResponder={() => true}>{children}</View>
  </Pressable>
);

export default GameOverOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});

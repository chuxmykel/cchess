import { StyleSheet, View } from 'react-native';

import Button from '../Button';
import { spacing } from '../../theme';

interface ConfirmMoveBarProps {
  onCancel: () => void;
  onConfirm: () => void;
}

// In place of a game's toolbar while a move waits on the board to be sent:
// take it back, or send it.
const ConfirmMoveBar: React.FC<ConfirmMoveBarProps> = ({
  onCancel,
  onConfirm,
}) => (
  <View style={styles.container} testID="confirm-move-bar">
    <Button
      label="Cancel"
      icon="close"
      variant="outline"
      onPress={onCancel}
      style={styles.button}
      testID="cancel-move-button"
    />
    <Button
      label="Confirm move"
      icon="check"
      onPress={onConfirm}
      style={styles.button}
      testID="confirm-move-button"
    />
  </View>
);

export default ConfirmMoveBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

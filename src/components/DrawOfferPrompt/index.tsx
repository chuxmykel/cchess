import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';

interface DrawOfferPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

const DrawOfferPrompt: React.FC<DrawOfferPromptProps> = ({
  onAccept,
  onDecline,
}) => (
  <View style={styles.container} testID="draw-offer-prompt">
    <Text style={styles.message}>Your opponent offers a draw</Text>
    <View style={styles.buttons}>
      <Button
        label="Decline"
        variant="outline"
        onPress={onDecline}
        style={styles.button}
        testID="decline-draw-button"
      />
      <Button
        label="Accept"
        variant="primary"
        onPress={onAccept}
        style={styles.button}
        testID="accept-draw-button"
      />
    </View>
  </View>
);

export default DrawOfferPrompt;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

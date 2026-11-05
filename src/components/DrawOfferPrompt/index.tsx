import { View, Text } from 'react-native';

import Button from '../Button';
import { fontSize, fontWeight, spacing, makeStyles } from '../../theme';

interface DrawOfferPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

const DrawOfferPrompt: React.FC<DrawOfferPromptProps> = ({
  onAccept,
  onDecline,
}) => {
  const styles = useStyles();
  return (
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
};

export default DrawOfferPrompt;

const useStyles = makeStyles((t) => ({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  message: {
    color: t.colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
}));

import { Linking, Modal, Text, View } from 'react-native';

import Button from '../Button';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import { useTermsAcceptance } from '../../hooks/useTermsAcceptance';
import { makeStyles } from '../../theme';

/** Over everything, for an account that hasn't accepted the terms in
 * force - since they changed, or from before they were asked. */
const TermsPrompt: React.FC = () => {
  const styles = useStyles();
  const terms = useTermsAcceptance();
  if (!terms.needsAcceptance) return null;
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card} testID="terms-prompt">
          <Text style={styles.title}>Our terms have changed</Text>
          <Text style={styles.text}>
            Read the updated terms of use and privacy policy, and accept them to
            carry on playing.
          </Text>
          <Button
            label="Terms of use"
            onPress={() => Linking.openURL(TERMS_URL)}
            variant="text"
            testID="terms-prompt-terms"
          />
          <Button
            label="Privacy policy"
            onPress={() => Linking.openURL(PRIVACY_URL)}
            variant="text"
            testID="terms-prompt-privacy"
          />
          {terms.error && <Text style={styles.error}>{terms.error}</Text>}
          <Button
            label={terms.isAccepting ? 'Accepting…' : 'Accept'}
            onPress={terms.accept}
            disabled={terms.isAccepting}
            testID="terms-prompt-accept"
          />
        </View>
      </View>
    </Modal>
  );
};

export default TermsPrompt;

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: t.spacing.xl,
    backgroundColor: t.colors.overlay,
  },
  card: {
    gap: t.spacing.md,
    padding: t.spacing.xl,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  title: {
    ...t.typography.title,
    color: t.colors.text,
  },
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.base,
  },
}));

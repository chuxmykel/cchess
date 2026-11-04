import { View, Text } from 'react-native';

import Button from '../Button';
import { makeStyles } from '../../theme';

interface SignInPromptProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

const SignInPrompt: React.FC<SignInPromptProps> = ({
  onSignIn,
  onCreateAccount,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID="sign-in-prompt">
      <Text style={styles.title}>{"You're playing as a guest"}</Text>
      <Text style={styles.body}>
        Sign in to play rated games and add friends.
      </Text>
      <View style={styles.actions}>
        <Button
          label="Sign in"
          onPress={onSignIn}
          style={styles.action}
          testID="sign-in-button"
        />
        <Button
          label="Create account"
          onPress={onCreateAccount}
          variant="outline"
          style={styles.action}
          testID="create-account-button"
        />
      </View>
    </View>
  );
};

export default SignInPrompt;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  title: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
  },
  body: {
    fontSize: t.fontSize.base,
    color: t.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginTop: t.spacing.sm,
  },
  action: {
    flex: 1,
  },
}));

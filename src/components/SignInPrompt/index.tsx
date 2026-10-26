import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';

interface SignInPromptProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

const SignInPrompt: React.FC<SignInPromptProps> = ({
  onSignIn,
  onCreateAccount,
}) => (
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

export default SignInPrompt;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 16,
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  action: {
    flex: 1,
  },
});

import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../Button';

interface AccountFormProps {
  children: React.ReactNode;
  errorMessage: string | null;
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  switchPrompt: string;
  switchLabel: string;
  onSwitch: () => void;
  testID?: string;
}

const AccountForm: React.FC<AccountFormProps> = ({
  children,
  errorMessage,
  submitLabel,
  canSubmit,
  onSubmit,
  switchPrompt,
  switchLabel,
  onSwitch,
  testID,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
        <View style={styles.fields}>{children}</View>
        {errorMessage && (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            testID="account-form-error"
          >
            {errorMessage}
          </Text>
        )}
        <Button
          label={submitLabel}
          onPress={onSubmit}
          disabled={!canSubmit}
          appearsDisabled={!canSubmit}
          testID="account-form-submit"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchPrompt}>{switchPrompt}</Text>
          <Button
            label={switchLabel}
            onPress={onSwitch}
            variant="text"
            testID="account-form-switch"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AccountForm;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  fields: {
    gap: 16,
  },
  error: {
    color: '#e53935',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  switchPrompt: {
    color: '#555',
    fontSize: 14,
  },
});

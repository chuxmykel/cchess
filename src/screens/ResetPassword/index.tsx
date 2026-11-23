import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import AccountForm from '../../components/AccountForm';
import PasswordField from '../../components/PasswordField';
import { RESET_PASSWORD_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { resetPassword } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

const MIN_PASSWORD_LENGTH = 8;

type ResetPasswordProps = NativeStackScreenProps<
  HomeStackParamList,
  'ResetPassword'
>;

/** Opened by a reset link from an email: a new password, then sign in. */
const ResetPassword: React.FC<ResetPasswordProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isDone, setIsDone] = useState(false);
  const reset = useAsyncAction(
    useCallback(
      () => resetPassword(route.params.token, password),
      [route.params.token, password],
    ),
    RESET_PASSWORD_FAILED_MESSAGE,
  );
  const mismatch = confirmation !== '' && confirmation !== password;
  const canSubmit =
    isDone ||
    (password.length >= MIN_PASSWORD_LENGTH &&
      confirmation === password &&
      !reset.isRunning);

  async function submit() {
    if (await reset.run()) setIsDone(true);
  }

  return (
    <AccountForm
      errorMessage={
        reset.errorMessage ?? (mismatch ? "The passwords don't match" : null)
      }
      submitLabel={
        isDone ? 'Sign in' : reset.isRunning ? 'Saving…' : 'Set password'
      }
      canSubmit={canSubmit}
      onSubmit={isDone ? () => navigation.replace('SignIn') : submit}
      testID="reset-password-screen"
    >
      {isDone ? (
        <Text style={styles.text} testID="reset-password-done">
          Your password is set, and every device was signed out. Sign in with
          it.
        </Text>
      ) : (
        <>
          <PasswordField
            label="New password"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            testID="password-input"
          />
          <PasswordField
            label="The same again"
            value={confirmation}
            onChangeText={setConfirmation}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => canSubmit && submit()}
            testID="password-confirmation-input"
          />
        </>
      )}
    </AccountForm>
  );
};

export default ResetPassword;

const useStyles = makeStyles((t) => ({
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
}));

import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import AccountForm from '../../components/AccountForm';
import TextField from '../../components/TextField';
import { RESET_REQUEST_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { requestPasswordReset } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

type ForgotPasswordProps = NativeStackScreenProps<
  HomeStackParamList,
  'ForgotPassword'
>;

/** Asks for a reset link by email - the reply is the same whether or not
 * the address has an account, as the server's is. */
const ForgotPassword: React.FC<ForgotPasswordProps> = ({ navigation }) => {
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const request = useAsyncAction(
    useCallback(() => requestPasswordReset(email.trim()), [email]),
    RESET_REQUEST_FAILED_MESSAGE,
  );

  async function submit() {
    if (await request.run()) setIsSent(true);
  }

  return (
    <AccountForm
      errorMessage={request.errorMessage}
      submitLabel={
        isSent
          ? 'Back to sign in'
          : request.isRunning
            ? 'Sending…'
            : 'Send link'
      }
      canSubmit={isSent || (email.trim() !== '' && !request.isRunning)}
      onSubmit={isSent ? navigation.goBack : submit}
      testID="forgot-password-screen"
    >
      {isSent ? (
        <Text style={styles.text} testID="forgot-password-sent">
          If {email.trim()} has a cchess account, we&apos;ve emailed it a link
          to set a new password. It works for an hour.
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Enter your account&apos;s email, and we&apos;ll send a link to set a
            new password.
          </Text>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="email-input"
          />
        </>
      )}
    </AccountForm>
  );
};

export default ForgotPassword;

const useStyles = makeStyles((t) => ({
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
}));

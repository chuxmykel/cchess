import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import AccountForm from '../../components/AccountForm';
import PasswordField from '../../components/PasswordField';
import TextField from '../../components/TextField';
import { CHANGE_EMAIL_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { requestEmailChange } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

type ChangeEmailProps = NativeStackScreenProps<
  HomeStackParamList,
  'ChangeEmail'
>;

/** A new address, confirmed by the password - it changes once the link
 * sent there is used. */
const ChangeEmail: React.FC<ChangeEmailProps> = ({ navigation }) => {
  const styles = useStyles();
  const { authorized } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSent, setIsSent] = useState(false);
  const change = useAsyncAction(
    useCallback(
      () =>
        authorized((token) =>
          requestEmailChange(email.trim(), password, token),
        ),
      [authorized, email, password],
    ),
    CHANGE_EMAIL_FAILED_MESSAGE,
  );

  async function submit() {
    if (await change.run()) setIsSent(true);
  }

  return (
    <AccountForm
      errorMessage={change.errorMessage}
      submitLabel={
        isSent ? 'Done' : change.isRunning ? 'Sending…' : 'Send link'
      }
      canSubmit={
        isSent || (email.trim() !== '' && password !== '' && !change.isRunning)
      }
      onSubmit={isSent ? navigation.goBack : submit}
      testID="change-email-screen"
    >
      {isSent ? (
        <Text style={styles.text} testID="change-email-sent">
          We&apos;ve emailed {email.trim()} a link. Your email changes once you
          open it.
        </Text>
      ) : (
        <>
          <TextField
            label="New email"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="password-input"
          />
        </>
      )}
    </AccountForm>
  );
};

export default ChangeEmail;

const useStyles = makeStyles((t) => ({
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
}));

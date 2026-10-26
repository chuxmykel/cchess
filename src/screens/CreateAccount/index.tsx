import { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import AccountForm from '../../components/AccountForm';
import PasswordField from '../../components/PasswordField';
import TextField from '../../components/TextField';
import UsernameAvailabilityIndicator from '../../components/UsernameAvailabilityIndicator';
import { CREATE_ACCOUNT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import {
  USERNAME_AVAILABILITY,
  useUsernameAvailability,
} from '../../hooks/useUsernameAvailability';
import { HomeStackParamList } from '../HomeStack/types';

type CreateAccountProps = NativeStackScreenProps<
  HomeStackParamList,
  'CreateAccount'
>;

const CreateAccount: React.FC<CreateAccountProps> = ({ navigation }) => {
  const { register } = useAuthSession();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const usernameAvailability = useUsernameAvailability(username);

  const registration = useAsyncAction(
    useCallback(
      () =>
        register({ username: username.trim(), email: email.trim(), password }),
      [register, username, email, password],
    ),
    CREATE_ACCOUNT_FAILED_MESSAGE,
  );
  const isFilledIn =
    username.trim() !== '' && email.trim() !== '' && password !== '';
  const isUsernameTaken = usernameAvailability === USERNAME_AVAILABILITY.TAKEN;
  const canSubmit = isFilledIn && !isUsernameTaken && !registration.isRunning;

  async function submit() {
    if (await registration.run()) {
      navigation.goBack();
    }
  }

  return (
    <AccountForm
      errorMessage={registration.errorMessage}
      submitLabel={
        registration.isRunning ? 'Creating account…' : 'Create account'
      }
      canSubmit={canSubmit}
      onSubmit={submit}
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      onSwitch={() => navigation.replace('SignIn')}
      testID="create-account-screen"
    >
      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoComplete="username-new"
        textContentType="username"
        placeholder="Letters, numbers and underscores"
        trailing={
          <UsernameAvailabilityIndicator availability={usernameAvailability} />
        }
        testID="username-input"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        testID="email-input"
      />
      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="At least 8 characters"
        returnKeyType="go"
        onSubmitEditing={() => canSubmit && submit()}
        testID="password-input"
      />
    </AccountForm>
  );
};

export default CreateAccount;

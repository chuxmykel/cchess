import { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import AccountForm from '../../components/AccountForm';
import PasswordField from '../../components/PasswordField';
import TextField from '../../components/TextField';
import { SIGN_IN_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { HomeStackParamList } from '../HomeStack/types';

type SignInProps = NativeStackScreenProps<HomeStackParamList, 'SignIn'>;

const SignIn: React.FC<SignInProps> = ({ navigation }) => {
  const { signIn } = useAuthSession();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInAttempt = useAsyncAction(
    useCallback(
      () => signIn({ usernameOrEmail: usernameOrEmail.trim(), password }),
      [signIn, usernameOrEmail, password],
    ),
    SIGN_IN_FAILED_MESSAGE,
  );
  const isFilledIn = usernameOrEmail.trim() !== '' && password !== '';
  const canSubmit = isFilledIn && !signInAttempt.isRunning;

  async function submit() {
    if (await signInAttempt.run()) {
      navigation.goBack();
    }
  }

  return (
    <AccountForm
      errorMessage={signInAttempt.errorMessage}
      submitLabel={signInAttempt.isRunning ? 'Signing in…' : 'Sign in'}
      canSubmit={canSubmit}
      onSubmit={submit}
      switchPrompt="New here?"
      switchLabel="Create an account"
      onSwitch={() => navigation.replace('CreateAccount')}
      testID="sign-in-screen"
    >
      <TextField
        label="Username or email"
        value={usernameOrEmail}
        onChangeText={setUsernameOrEmail}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        testID="username-or-email-input"
      />
      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => canSubmit && submit()}
        testID="password-input"
      />
    </AccountForm>
  );
};

export default SignIn;

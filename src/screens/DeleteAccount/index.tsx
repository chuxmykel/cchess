import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { analytics } from '../../analytics/analytics';
import AccountForm from '../../components/AccountForm';
import PasswordField from '../../components/PasswordField';
import { DELETE_ACCOUNT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { deleteAccount } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

type DeleteAccountProps = NativeStackScreenProps<
  HomeStackParamList,
  'DeleteAccount'
>;

/** Deletes the account, its password confirming it - then the app carries
 * on as a new guest, back at Home. */
const DeleteAccount: React.FC<DeleteAccountProps> = ({ navigation }) => {
  const styles = useStyles();
  const { authorized, signOut } = useAuthSession();
  const [password, setPassword] = useState('');

  const deletion = useAsyncAction(
    useCallback(async () => {
      await authorized((token) => deleteAccount(password, token));
      // The account's gone, so its session is too: start afresh as a guest.
      await signOut();
    }, [authorized, password, signOut]),
    DELETE_ACCOUNT_FAILED_MESSAGE,
  );
  const canSubmit = password !== '' && !deletion.isRunning;

  async function submit() {
    if (await deletion.run()) {
      analytics.capture('account_deleted');
      navigation.navigate('HomeTabs', { screen: 'HomeTabStack' });
    }
  }

  return (
    <AccountForm
      errorMessage={deletion.errorMessage}
      submitLabel={deletion.isRunning ? 'Deleting…' : 'Delete my account'}
      canSubmit={canSubmit}
      onSubmit={submit}
      destructive
      testID="delete-account-screen"
    >
      <Text style={styles.text}>
        This deletes your account for good: your email, password, profile,
        messages, chat, notes, friends and blocks. Games you&apos;re playing are
        resigned. Your finished games stay, for your opponents, under
        &quot;Deleted player&quot;.
      </Text>
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

export default DeleteAccount;

const useStyles = makeStyles((t) => ({
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    lineHeight: t.fontSize.base * 1.4,
  },
}));

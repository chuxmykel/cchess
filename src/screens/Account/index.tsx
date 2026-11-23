import { ScrollView } from 'react-native';

import ActionList from '../../components/ActionList';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles } from '../../theme';

type AccountProps = {
  navigation: Pick<HomeStackScreenProps<'Account'>['navigation'], 'navigate'>;
};

/** Your account's settings - Settings shows it signed in only. */
const Account: React.FC<AccountProps> = ({ navigation }) => {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="account-screen"
    >
      <ActionList
        items={[
          {
            label: 'Delete account',
            icon: 'account-remove-outline',
            destructive: true,
            onPress: () => navigation.navigate('DeleteAccount'),
            testID: 'delete-account-row',
          },
        ]}
      />
    </ScrollView>
  );
};

export default Account;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingVertical: t.spacing.lg,
    gap: t.spacing.xl,
  },
}));

import { ScrollView, Switch, Text, View } from 'react-native';

import ActionList from '../../components/ActionList';
import { useChatWithStrangers } from '../../hooks/useChatWithStrangers';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles, useTheme } from '../../theme';

type AccountProps = {
  navigation: Pick<HomeStackScreenProps<'Account'>['navigation'], 'navigate'>;
};

/** Your account's settings - Settings shows it signed in only. */
const Account: React.FC<AccountProps> = ({ navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const chat = useChatWithStrangers();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="account-screen"
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>
            Chat with players who aren&apos;t friends
          </Text>
          <Switch
            value={chat.isOn}
            onValueChange={chat.set}
            trackColor={{ true: colors.accent }}
            thumbColor={colors.switchThumb}
            accessibilityLabel="Chat with players who aren't friends"
            testID="chat-with-strangers-switch"
          />
        </View>
        <Text style={styles.note}>
          Game chat with someone who isn&apos;t your friend needs you both to
          turn this on. Friends can always chat.
        </Text>
        {chat.error && <Text style={styles.error}>{chat.error}</Text>}
      </View>
      <ActionList
        items={[
          {
            label: 'Blocked players',
            icon: 'account-cancel-outline',
            onPress: () => navigation.navigate('BlockedPlayers'),
            testID: 'blocked-players-row',
          },
        ]}
      />
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
  card: {
    marginHorizontal: t.spacing.lg,
    gap: t.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
  },
  label: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  note: {
    color: t.colors.textSecondary,
    fontSize: t.fontSize.md,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.md,
  },
}));

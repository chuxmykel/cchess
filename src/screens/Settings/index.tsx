import { Linking, ScrollView, Switch, Text, View } from 'react-native';

import { isAnalyticsAvailable } from '../../analytics/analytics';
import ActionList from '../../components/ActionList';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '../../constants/legal';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles, useTheme } from '../../theme';

type SettingsProps = {
  navigation: Pick<HomeStackScreenProps<'Settings'>['navigation'], 'navigate'>;
};

// Every setting in the app, in one place - each kept on the device, so a
// guest has them too; the account's own, signed in only.
const Settings: React.FC<SettingsProps> = ({ navigation }) => {
  const styles = useStyles();
  const session = useAuthSession();
  const isSignedIn = session.isReady && !session.user.isGuest;
  const { colors } = useTheme();
  const consent = useAnalyticsConsent();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="settings-screen"
    >
      {isSignedIn && (
        <ActionList
          items={[
            {
              label: 'Account',
              icon: 'account-cog-outline',
              onPress: () => navigation.navigate('Account'),
              testID: 'account-row',
            },
          ]}
        />
      )}
      <ActionList
        items={[
          {
            label: 'Appearance',
            icon: 'palette-outline',
            onPress: () => navigation.navigate('Appearance'),
            testID: 'appearance-row',
          },
          {
            label: 'Analysis',
            icon: 'head-cog-outline',
            onPress: () => navigation.navigate('AnalysisSettings'),
            testID: 'analysis-settings-row',
          },
          {
            label: 'Daily games',
            icon: 'calendar-clock',
            onPress: () => navigation.navigate('DailyGameSettings'),
            testID: 'daily-game-settings-row',
          },
          {
            label: 'Game review',
            icon: 'lightbulb-on-outline',
            onPress: () => navigation.navigate('ReviewSettings'),
            testID: 'review-settings-row',
          },
        ]}
      />
      {isAnalyticsAvailable && (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Share usage and crash data</Text>
            <Switch
              value={consent.enabled}
              onValueChange={consent.setEnabled}
              trackColor={{ true: colors.accent }}
              thumbColor={colors.switchThumb}
              accessibilityLabel="Share usage and crash data"
              testID="analytics-switch"
            />
          </View>
          <Text style={styles.note}>
            Which screens you use, your device&apos;s model and system, and
            crashes - never what you write. It helps us fix and improve cchess.
          </Text>
        </View>
      )}
      <ActionList
        items={[
          {
            label: 'Privacy policy',
            icon: 'shield-account-outline',
            onPress: () => Linking.openURL(PRIVACY_URL),
            testID: 'privacy-row',
          },
          {
            label: 'Terms of use',
            icon: 'file-document-outline',
            onPress: () => Linking.openURL(TERMS_URL),
            testID: 'terms-row',
          },
          {
            label: 'Contact support',
            icon: 'email-outline',
            onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
            testID: 'support-row',
          },
          {
            label: 'Licenses',
            icon: 'scale-balance',
            onPress: () => navigation.navigate('Licenses'),
            testID: 'licenses-row',
          },
        ]}
      />
    </ScrollView>
  );
};

export default Settings;

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
}));

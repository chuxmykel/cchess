import { ScrollView } from 'react-native';

import ActionList from '../../components/ActionList';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles } from '../../theme';

type SettingsProps = {
  navigation: Pick<HomeStackScreenProps<'Settings'>['navigation'], 'navigate'>;
};

// Every setting in the app, in one place - each kept on the device, so a
// guest has them too.
const Settings: React.FC<SettingsProps> = ({ navigation }) => {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="settings-screen"
    >
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
        ]}
      />
      <ActionList
        items={[
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
}));

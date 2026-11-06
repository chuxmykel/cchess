import { ScrollView, Switch, Text, View } from 'react-native';

import { useDailyGameSettingsContext } from '../../context/DailyGameSettingsContext';
import { makeStyles, useTheme } from '../../theme';

// Daily games' settings, over a game: each change is saved as it's made.
const DailyGameSettings: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { settings, update } = useDailyGameSettingsContext();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="daily-game-settings"
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.label}>Confirm moves</Text>
          <Text style={styles.hint}>
            Ask before sending each move, to take it back if it slipped.
          </Text>
        </View>
        <Switch
          value={settings.confirmMoves}
          onValueChange={(confirmMoves) => update({ confirmMoves })}
          trackColor={{ true: colors.accent }}
          accessibilityLabel="Confirm moves"
          testID="daily-setting-confirmMoves"
        />
      </View>
    </ScrollView>
  );
};

export default DailyGameSettings;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 40,
  },
  text: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  label: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.medium,
    color: t.colors.text,
  },
  hint: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
}));

import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import RadioRow from '../RadioRow';
import NotchedSlider from '../NotchedSlider';
import {
  AnalysisSettings,
  EvalBarPosition,
  MAX_ENGINE_LINES,
  SEARCH_SECONDS,
} from '../../constants/analysis';
import { makeStyles, useTheme } from '../../theme';

interface AnalysisSettingsFormProps {
  settings: AnalysisSettings;
  onChange: (change: Partial<AnalysisSettings>) => void;
}

type Toggle = 'evalBar' | 'bestMoveArrows' | 'threatArrows' | 'sounds';

const EVAL_BAR_POSITIONS: { key: EvalBarPosition; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'right', label: 'Right' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
];

// The search time slider's last stop, past the most seconds: unlimited.
const UNLIMITED = SEARCH_SECONDS.max + 1;

function describeLines(count: number): string {
  if (count === 0) return 'Off';
  return count === 1 ? '1 line' : `${count} lines`;
}

function describeSearch(seconds: number | null): string {
  return seconds === null ? 'Unlimited' : `${seconds} s`;
}

// What the analysis board shows, and how long its engine looks at each
// position.
const AnalysisSettingsForm: React.FC<AnalysisSettingsFormProps> = ({
  settings,
  onChange,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const toggle = (key: Toggle, label: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={settings[key]}
        onValueChange={(value) => onChange({ [key]: value })}
        trackColor={{ true: colors.accent }}
        accessibilityLabel={label}
        testID={`analysis-setting-${key}`}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="analysis-settings"
    >
      <View style={styles.section}>
        {toggle('evalBar', 'Evaluation bar')}
        {settings.evalBar && (
          <RadioRow
            options={EVAL_BAR_POSITIONS}
            selected={settings.evalBarPosition}
            onSelect={(evalBarPosition) => onChange({ evalBarPosition })}
            testIDPrefix="eval-bar-position-"
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Engine lines</Text>
          <Text style={styles.value} testID="engine-line-count">
            {describeLines(settings.engineLineCount)}
          </Text>
        </View>
        <NotchedSlider
          minimumValue={0}
          maximumValue={MAX_ENGINE_LINES}
          step={1}
          value={settings.engineLineCount}
          onValueChange={(engineLineCount) => onChange({ engineLineCount })}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          accessibilityLabel="Engine lines"
          testID="engine-line-count-slider"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Search time</Text>
          <Text style={styles.value} testID="search-time">
            {describeSearch(settings.searchSeconds)}
          </Text>
        </View>
        <NotchedSlider
          minimumValue={SEARCH_SECONDS.min}
          maximumValue={UNLIMITED}
          step={1}
          value={settings.searchSeconds ?? UNLIMITED}
          onValueChange={(seconds) =>
            onChange({ searchSeconds: seconds >= UNLIMITED ? null : seconds })
          }
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          accessibilityLabel="Search time"
          testID="search-time-slider"
        />
        <Text style={styles.hint}>
          How long the engine looks at each position - longer is stronger.
          Unlimited keeps looking until you move on.
        </Text>
      </View>

      <View style={styles.section}>
        {toggle('bestMoveArrows', 'Best move arrows')}
        {toggle('threatArrows', 'Threat arrow')}
        {toggle('sounds', 'Sounds')}
      </View>
    </ScrollView>
  );
};

export default AnalysisSettingsForm;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.lg,
    gap: t.spacing.sm,
  },
  section: {
    gap: t.spacing.sm,
    paddingBottom: t.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  label: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.medium,
    color: t.colors.text,
  },
  value: {
    fontSize: t.fontSize.lg,
    color: t.colors.accent,
    fontWeight: t.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
}));

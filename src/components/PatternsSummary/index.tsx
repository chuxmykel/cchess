import { Text, View } from 'react-native';

import Button from '../Button';
import {
  PUZZLE_THEME_LABELS,
  type PuzzleTheme,
} from '../../domain/puzzles/themes';
import type { Patterns } from '../../domain/review/patterns';
import { makeStyles } from '../../theme';

interface PatternsSummaryProps {
  patterns: Patterns;
  // Practising the theme your slips most come down to.
  onPractise: (theme: PuzzleTheme) => void;
}

// Your patterns at a glance, over the last month's reviewed games: how
// accurate you were, the tactic you keep missing - with its puzzles - and
// how the clock treats you. The rest is behind View All.
const PatternsSummary: React.FC<PatternsSummaryProps> = ({
  patterns,
  onPractise,
}) => {
  const styles = useStyles();
  const weakest = patterns.weakThemes[0]?.theme ?? null;
  const clock = patterns.accuracyByClock;
  const clockDrop = clock ? Math.round(clock.plenty - clock.short) : 0;

  return (
    <View style={styles.card} testID="profile-patterns">
      <View style={styles.headline}>
        <Text style={styles.accuracy} testID="patterns-accuracy">
          {patterns.accuracy === null
            ? '-'
            : `${Math.round(patterns.accuracy)}%`}
        </Text>
        <Text style={styles.caption}>
          average accuracy over {patterns.games}{' '}
          {patterns.games === 1 ? 'reviewed game' : 'reviewed games'} this month
        </Text>
      </View>
      {weakest && (
        <View style={styles.block} testID="patterns-weakest">
          <Text style={styles.line}>
            You keep missing {PUZZLE_THEME_LABELS[weakest].toLowerCase()}
          </Text>
          <Button
            label="Practise"
            variant="outline"
            icon="puzzle-outline"
            onPress={() => onPractise(weakest)}
            testID="patterns-practise"
          />
        </View>
      )}
      {clock && clockDrop > 0 && (
        <Text style={styles.line} testID="patterns-clock">
          Your accuracy drops by {clockDrop} points when you&apos;re short of
          time.
        </Text>
      )}
    </View>
  );
};

export default PatternsSummary;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    gap: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  headline: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  accuracy: { ...t.typography.title, color: t.colors.text },
  caption: { flex: 1, ...t.typography.caption, color: t.colors.textMuted },
  block: { gap: t.spacing.sm },
  line: { ...t.typography.body, color: t.colors.text },
}));

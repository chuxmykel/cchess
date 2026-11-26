import { Text, View } from 'react-native';

import Button from '../Button';
import {
  PUZZLE_THEME_LABELS,
  type PuzzleTheme,
} from '../../domain/puzzles/themes';
import type { Phase } from '../../domain/review/digest';
import type { Patterns } from '../../domain/review/patterns';
import { makeStyles } from '../../theme';

const PHASES: { phase: Phase; label: string }[] = [
  { phase: 'opening', label: 'Opening' },
  { phase: 'middlegame', label: 'Middlegame' },
  { phase: 'endgame', label: 'Endgame' },
];
const OPENINGS_SHOWN = 3;

interface PatternsCardProps {
  patterns: Patterns;
  // Practising the theme your slips most come down to.
  onPractise: (theme: PuzzleTheme) => void;
}

// What keeps happening in your recent reviewed games: where you leave
// pieces hanging, how your accuracy holds up short of time, how your
// openings go, and the tactic you keep missing - with its puzzles.
const PatternsCard: React.FC<PatternsCardProps> = ({
  patterns,
  onPractise,
}) => {
  const styles = useStyles();
  const hanging = PHASES.map(({ phase, label }) => ({
    label,
    count: patterns.hangingByPhase[phase],
  }));
  const mostHanging = Math.max(...hanging.map(({ count }) => count));
  const weakest = patterns.weakThemes[0]?.theme ?? null;

  return (
    <View style={styles.card} testID="profile-patterns">
      <Text style={styles.caption}>
        From your last {patterns.games}{' '}
        {patterns.games === 1 ? 'reviewed game' : 'reviewed games'}
      </Text>

      {weakest && (
        <View style={styles.block} testID="patterns-weakest">
          <Text style={styles.heading}>
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

      <View style={styles.block}>
        <Text style={styles.subheading}>Pieces left hanging</Text>
        {mostHanging === 0 ? (
          <Text style={styles.line} testID="patterns-hanging-none">
            None. Every piece looked after.
          </Text>
        ) : (
          hanging.map(({ label, count }) => (
            <View key={label} style={styles.barRow}>
              <Text style={styles.barLabel}>{label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { width: `${(count / mostHanging) * 100}%` },
                  ]}
                />
              </View>
              <Text
                style={styles.barCount}
                testID={`patterns-hanging-${label.toLowerCase()}`}
              >
                {count}
              </Text>
            </View>
          ))
        )}
      </View>

      {patterns.accuracyByClock && (
        <View style={styles.block} testID="patterns-clock">
          <Text style={styles.subheading}>Accuracy on the clock</Text>
          <Text style={styles.line}>
            {Math.round(patterns.accuracyByClock.plenty)}% with time to spare,{' '}
            {Math.round(patterns.accuracyByClock.short)}% when short of it
          </Text>
        </View>
      )}

      {patterns.openings.length > 0 && (
        <View style={styles.block} testID="patterns-openings">
          <Text style={styles.subheading}>Your openings</Text>
          {patterns.openings.slice(0, OPENINGS_SHOWN).map((opening) => (
            <View key={opening.name} style={styles.openingRow}>
              <Text style={styles.openingName} numberOfLines={1}>
                {opening.name}
              </Text>
              <Text style={styles.openingScore}>
                {opening.wins}W {opening.draws}D {opening.losses}L
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default PatternsCard;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    gap: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  block: { gap: t.spacing.sm },
  caption: { ...t.typography.caption, color: t.colors.textMuted },
  heading: { ...t.typography.bodyStrong, color: t.colors.text },
  subheading: { ...t.typography.label, color: t.colors.textMuted },
  line: { color: t.colors.text, fontSize: t.fontSize.base },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  barLabel: { width: 96, color: t.colors.text, fontSize: t.fontSize.base },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.separator,
    overflow: 'hidden',
  },
  bar: { height: 8, backgroundColor: t.colors.danger },
  barCount: {
    width: 24,
    textAlign: 'right',
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  openingRow: { flexDirection: 'row', gap: t.spacing.sm },
  openingName: { flex: 1, color: t.colors.text, fontSize: t.fontSize.base },
  openingScore: { color: t.colors.textMuted, fontSize: t.fontSize.base },
}));

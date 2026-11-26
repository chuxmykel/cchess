import { useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Button from '../../components/Button';
import Icon from '../../components/Icon';
import {
  PUZZLE_THEME_LABELS,
  PUZZLE_THEMES,
  type PuzzleTheme,
} from '../../domain/puzzles/themes';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { usePuzzleHome } from '../../hooks/usePuzzles';
import { makeStyles } from '../../theme';
import type { PuzzlesStackScreenProps } from '../PuzzlesStack/types';

// The Puzzles tab: the tactics you missed in your own games, due on their
// schedule, and practice from lichess's pool at your puzzle rating - the
// themes your games slip on suggested first.
const Puzzles: React.FC<PuzzlesStackScreenProps<'Puzzles'>> = ({
  navigation,
}) => {
  const styles = useStyles();
  const { status, mine, rating, suggested, reload } = usePuzzleHome();
  const refresh = usePullToRefresh(reload);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const practise = (theme?: PuzzleTheme) =>
    navigation.navigate('Puzzle', { deck: { deck: 'pool', theme } });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl {...refresh} />}
      testID="puzzles-screen"
    >
      {status === 'error' && (
        <View style={styles.card} testID="puzzles-error">
          <Text style={styles.body}>
            Couldn&apos;t load your puzzles. Pull down to try again.
          </Text>
        </View>
      )}

      <View style={styles.card} testID="puzzles-mine">
        <Text style={styles.title}>From your games</Text>
        <Text style={styles.body}>
          Tactics you missed, back on a schedule until you find them every time.
        </Text>
        <View style={styles.counts}>
          <Count label="Due" value={mine.due} testID="puzzles-mine-due" />
          <Count
            label="Learning"
            value={mine.learning}
            testID="puzzles-mine-learning"
          />
          <Count
            label="Learnt"
            value={mine.mastered}
            testID="puzzles-mine-mastered"
          />
        </View>
        {mine.due > 0 ? (
          <Button
            label={`Solve ${mine.due} due`}
            icon="puzzle-outline"
            onPress={() =>
              navigation.navigate('Puzzle', { deck: { deck: 'mine' } })
            }
            testID="puzzles-mine-start"
          />
        ) : (
          <Text style={styles.caption} testID="puzzles-mine-none">
            {mine.learning + mine.mastered > 0
              ? 'Nothing due today. Come back tomorrow.'
              : 'Review a game you played: the tactics you missed show up here.'}
          </Text>
        )}
      </View>

      <View style={styles.card} testID="puzzles-practice">
        <View style={styles.titleRow}>
          <Text style={styles.title}>Practice</Text>
          {rating !== null && (
            <Text style={styles.rating} testID="puzzle-rating">
              {rating}
            </Text>
          )}
        </View>
        <Text style={styles.body}>
          Puzzles from lichess&apos;s database, near your puzzle rating.
        </Text>
        <Button
          label="Start"
          icon="play"
          onPress={() => practise()}
          testID="puzzles-practice-start"
        />
        {suggested.length > 0 && (
          <>
            <Text style={styles.subheading}>Suggested for you</Text>
            <View style={styles.chips}>
              {suggested.map((theme) => (
                <ThemeChip
                  key={theme}
                  theme={theme}
                  suggested
                  onPress={() => practise(theme)}
                />
              ))}
            </View>
          </>
        )}
        <Text style={styles.subheading}>Themes</Text>
        <View style={styles.chips}>
          {PUZZLE_THEMES.filter((theme) => !suggested.includes(theme)).map(
            (theme) => (
              <ThemeChip
                key={theme}
                theme={theme}
                onPress={() => practise(theme)}
              />
            ),
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const Count: React.FC<{ label: string; value: number; testID: string }> = ({
  label,
  value,
  testID,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.count}>
      <Text style={styles.countValue} testID={testID}>
        {value}
      </Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
};

const ThemeChip: React.FC<{
  theme: PuzzleTheme;
  suggested?: boolean;
  onPress: () => void;
}> = ({ theme, suggested = false, onPress }) => {
  const styles = useStyles();
  return (
    <Pressable
      style={[styles.chip, suggested && styles.chipSuggested]}
      onPress={onPress}
      accessibilityRole="button"
      testID={`puzzle-theme-${theme}`}
    >
      {suggested && <Icon name="target" size={14} />}
      <Text style={[styles.chipLabel, suggested && styles.chipLabelSuggested]}>
        {PUZZLE_THEME_LABELS[theme]}
      </Text>
    </Pressable>
  );
};

export default Puzzles;

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: { padding: t.spacing.lg, gap: t.spacing.lg },
  card: {
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: { ...t.typography.heading, color: t.colors.text },
  rating: { ...t.typography.heading, color: t.colors.accent },
  subheading: { ...t.typography.label, color: t.colors.textMuted },
  body: { ...t.typography.body, color: t.colors.textMuted },
  caption: { ...t.typography.caption, color: t.colors.textMuted },
  counts: { flexDirection: 'row', justifyContent: 'space-around' },
  count: { alignItems: 'center' },
  countValue: { ...t.typography.title, color: t.colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.separator,
  },
  chipSuggested: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.accentSubtle,
  },
  chipLabel: { color: t.colors.text, fontSize: t.fontSize.base },
  chipLabelSuggested: {
    color: t.colors.accent,
    fontWeight: t.fontWeight.semibold,
  },
}));

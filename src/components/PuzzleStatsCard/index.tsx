import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  PUZZLE_THEME_LABELS,
  type ThemeStrength,
  themeStrengths,
} from '../../domain/puzzles/themes';
import { PuzzleStats } from '../../network/restClient';
import { makeStyles, useTheme } from '../../theme';

interface PuzzleStatsCardProps {
  stats: PuzzleStats;
}

function puzzlesLabel(count: number): string {
  return count === 1 ? '1 puzzle' : `${count} puzzles`;
}

function percentOf(count: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((count / total) * 100)}%`;
}

const themeLine = ({ theme, solved, attempts }: ThemeStrength) =>
  `${PUZZLE_THEME_LABELS[theme]} · ${percentOf(solved, attempts)} of ${attempts}`;

/** Puzzles over a period: tried, solved and missed, the best solve, the
 * longest streaks, and the themes you're strongest and weakest at. */
const PuzzleStatsCard: React.FC<PuzzleStatsCardProps> = ({ stats }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { strongest, weakest } = themeStrengths(stats.themes);

  const rows = [
    {
      label: 'Best solve',
      value: stats.bestSolve ? `Rated ${stats.bestSolve.rating}` : '—',
      testID: 'puzzle-stats-best-solve',
    },
    {
      label: 'Best solving streak',
      value: puzzlesLabel(stats.longestSolvedStreak),
      testID: 'puzzle-stats-solved-streak',
    },
    {
      label: 'Worst missing streak',
      value: puzzlesLabel(stats.longestMissedStreak),
      testID: 'puzzle-stats-missed-streak',
    },
  ];
  const results = [
    {
      key: 'solved',
      label: 'Solved',
      count: stats.solved,
      color: colors.results.win,
    },
    {
      key: 'missed',
      label: 'Missed',
      count: stats.missed,
      color: colors.results.loss,
    },
  ];

  return (
    <View style={styles.card} testID="puzzle-stats">
      <View style={styles.total}>
        <Text style={styles.totalCount} testID="puzzle-stats-attempts">
          {stats.attempts}
        </Text>
        <Text style={styles.label}>
          {stats.attempts === 1 ? 'Puzzle tried' : 'Puzzles tried'}
        </Text>
      </View>
      <View style={styles.results}>
        {results.map((result) => (
          <View
            key={result.key}
            style={styles.result}
            testID={`puzzle-stats-${result.key}`}
          >
            <Text style={[styles.resultCount, { color: result.color }]}>
              {result.count}
            </Text>
            <Text style={styles.label}>
              {result.label} · {percentOf(result.count, stats.attempts)}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <Fragment key={row.label}>
          <View style={styles.divider} />
          <View style={styles.row} testID={row.testID}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        </Fragment>
      ))}
      {[
        { title: 'Strongest themes', themes: strongest, id: 'strongest' },
        { title: 'Weakest themes', themes: weakest, id: 'weakest' },
      ].map(
        ({ title, themes, id }) =>
          themes.length > 0 && (
            <Fragment key={id}>
              <View style={styles.divider} />
              <View style={styles.themes} testID={`puzzle-stats-${id}-themes`}>
                <Text style={styles.rowLabel}>{title}</Text>
                {themes.map((theme) => (
                  <Text key={theme.theme} style={styles.themeLine}>
                    {themeLine(theme)}
                  </Text>
                ))}
              </View>
            </Fragment>
          ),
      )}
    </View>
  );
};

export default PuzzleStatsCard;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  total: {
    alignItems: 'center',
    paddingTop: t.spacing.lg,
  },
  totalCount: {
    color: t.colors.text,
    fontSize: t.fontSize.h1,
    fontWeight: t.fontWeight.bold,
  },
  results: {
    flexDirection: 'row',
    paddingVertical: t.spacing.md,
  },
  result: {
    flex: 1,
    alignItems: 'center',
  },
  resultCount: {
    fontSize: t.fontSize.h3,
    fontWeight: t.fontWeight.bold,
  },
  label: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  rowValue: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
  themes: {
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  themeLine: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.base,
  },
}));

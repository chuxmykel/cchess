import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import { NotableGame, RatingStats } from '../../network/restClient';
import { formatTimePlayed } from '../../utils/rating';
import { makeStyles, useTheme } from '../../theme';

interface CategoryStatsCardProps {
  stats: RatingStats;
  onOpenGame: (gameId: string) => void;
}

const RESULTS = [
  { key: 'wins', label: 'Wins', result: 'win' },
  { key: 'draws', label: 'Draws', result: 'draw' },
  { key: 'losses', label: 'Losses', result: 'loss' },
] as const;

function gamesLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`;
}

function percentOf(count: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((count / total) * 100)}%`;
}

type StatRow = {
  label: string;
  value: string;
  onPress?: () => void;
  testID: string;
};

/** A category's totals over a period: games and results, time spent,
 * the best win and worst loss, and the longest streaks. */
const CategoryStatsCard: React.FC<CategoryStatsCardProps> = ({
  stats,
  onOpenGame,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  function notableRow(
    label: string,
    game: NotableGame | null,
    testID: string,
  ): StatRow {
    return {
      label,
      value: game
        ? `${game.opponentDisplayName} (${game.opponentRating})`
        : '—',
      onPress: game ? () => onOpenGame(game.gameId) : undefined,
      testID,
    };
  }

  const rows: StatRow[] = [
    {
      label: 'Time spent playing',
      value: formatTimePlayed(stats.timePlayedMs),
      testID: 'stats-time-played',
    },
    notableRow('Best win', stats.bestWin, 'stats-best-win'),
    notableRow('Worst loss', stats.worstLoss, 'stats-worst-loss'),
    {
      label: 'Best win streak',
      value: gamesLabel(stats.longestWinStreak),
      testID: 'stats-win-streak',
    },
    {
      label: 'Worst losing streak',
      value: gamesLabel(stats.longestLosingStreak),
      testID: 'stats-losing-streak',
    },
  ];

  return (
    <View style={styles.card} testID="category-stats">
      <View style={styles.total}>
        <Text style={styles.totalCount} testID="stats-games">
          {stats.games}
        </Text>
        <Text style={styles.label}>
          {stats.games === 1 ? 'Game played' : 'Games played'}
        </Text>
      </View>
      <View style={styles.results}>
        {RESULTS.map((result) => (
          <View
            key={result.key}
            style={styles.result}
            testID={`stats-${result.key}`}
          >
            <Text
              style={[
                styles.resultCount,
                { color: colors.results[result.result] },
              ]}
            >
              {stats[result.key]}
            </Text>
            <Text style={styles.label}>
              {result.label} · {percentOf(stats[result.key], stats.games)}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <Fragment key={row.label}>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={row.onPress}
            disabled={!row.onPress}
            accessibilityRole={row.onPress ? 'button' : undefined}
            testID={row.testID}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
            {row.onPress && (
              <Icon name="chevron-right" size={18} color={colors.textMuted} />
            )}
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
};

export default CategoryStatsCard;

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
    fontSize: t.fontSize.lg,
  },
  rowValue: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
}));

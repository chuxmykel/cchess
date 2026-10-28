import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import { MUTED_COLOR } from '../../constants/colors';
import { NotableGame, RatingStats } from '../../network/restClient';
import { formatTimePlayed } from '../../utils/rating';

interface CategoryStatsCardProps {
  stats: RatingStats;
  onOpenGame: (gameId: string) => void;
}

const RESULTS = [
  { key: 'wins', label: 'Wins', color: '#5a9e2f' },
  { key: 'draws', label: 'Draws', color: '#c99a1c' },
  { key: 'losses', label: 'Losses', color: '#c8402a' },
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
            <Text style={[styles.resultCount, { color: result.color }]}>
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
              <Icon name="chevron-right" size={18} color={MUTED_COLOR} />
            )}
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
};

export default CategoryStatsCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  total: {
    alignItems: 'center',
    paddingTop: 14,
  },
  totalCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  results: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  result: {
    flex: 1,
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    color: MUTED_COLOR,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});

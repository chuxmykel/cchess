import { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { parseISO, subDays } from 'date-fns';

import Button from '../../components/Button';
import CategoryStatsCard from '../../components/CategoryStatsCard';
import EmptyState from '../../components/EmptyState';
import GameTypeIcon from '../../components/GameTypeIcon';
import Placeholder from '../../components/Placeholder';
import RatingChange from '../../components/RatingChange';
import RatingChart from '../../components/RatingChart';
import RatingCategoryPicker from '../../components/RatingCategoryPicker';
import RatingHighLowCard from '../../components/RatingHighLowCard';
import SegmentedTabs from '../../components/SegmentedTabs';
import { MUTED_COLOR } from '../../constants/colors';
import {
  DEFAULT_RATING_PERIOD,
  RATING_PERIOD_DAYS,
  RATING_PERIOD_LABELS,
} from '../../constants/ratingPeriods';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { useRatingStats } from '../../hooks/useRatingStats';
import {
  RATING_PERIODS,
  RatingPeriod,
  RatingStats,
} from '../../network/restClient';
import { formatRating } from '../../utils/rating';
import { HomeStackScreenProps } from '../HomeStack/types';

const PERIOD_CAPTIONS: Record<RatingPeriod, string> = {
  '1w': 'Past week',
  '1m': 'Past month',
  '3m': 'Past 3 months',
  '1y': 'Past year',
  all: 'All time',
};

/** Where the chart starts: the period's start, or for all time, the first
 * rated game. */
function chartStart(stats: RatingStats, now: Date): Date {
  if (stats.period === 'all') {
    return stats.history.length > 0 ? parseISO(stats.history[0].at) : now;
  }
  return subDays(now, RATING_PERIOD_DAYS[stats.period]);
}

type RatingStatsProps = Pick<
  HomeStackScreenProps<'RatingStats'>,
  'navigation' | 'route'
>;

const RatingStatsScreen: React.FC<RatingStatsProps> = ({
  navigation,
  route,
}) => {
  const { username, displayName, category } = route.params;
  const [period, setPeriod] = useState<RatingPeriod>(DEFAULT_RATING_PERIOD);
  const { state, reload } = useRatingStats(username, category, period);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <RatingCategoryPicker
          category={category}
          onSelect={(selected) => navigation.setParams({ category: selected })}
        />
      ),
    });
  }, [navigation, category]);

  if (state.status === 'loading') {
    return (
      <View style={styles.loading} testID="rating-stats-loading">
        <Placeholder width="40%" height={36} />
        <Placeholder width="90%" height={160} />
        <Placeholder width="90%" height={80} />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.error} testID="rating-stats-error">
        <Text>{"These stats couldn't be loaded."}</Text>
        <Button label="Try again" variant="outline" onPress={reload} />
      </View>
    );
  }

  const { stats, isUpdating, didFail } = state;
  const now = new Date();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="rating-stats-screen"
    >
      <View style={styles.header}>
        <GameTypeIcon type={stats.rating.category} size={28} />
        <View style={styles.headerText}>
          <Text style={styles.name}>
            {displayName} · {GAME_TYPE_LABELS[stats.rating.category]}
          </Text>
          <View style={styles.ratingLine}>
            <Text style={styles.rating} testID="rating-stats-rating">
              {formatRating(stats.rating.rating, stats.rating.provisional)}
            </Text>
            {stats.ratingChange !== null && (
              <RatingChange
                change={stats.ratingChange}
                testID="rating-stats-change"
              />
            )}
          </View>
          <Text style={styles.caption}>{PERIOD_CAPTIONS[stats.period]}</Text>
        </View>
      </View>

      <SegmentedTabs<RatingPeriod>
        tabs={RATING_PERIODS.map((key) => ({
          key,
          label: RATING_PERIOD_LABELS[key],
        }))}
        selected={period}
        onSelect={setPeriod}
      />

      {didFail && (
        <View style={styles.failed} testID="rating-stats-period-failed">
          <Text style={styles.failedText}>
            {`Couldn't load the ${PERIOD_CAPTIONS[period].toLowerCase()}.`}
          </Text>
          <Button label="Try again" variant="text" onPress={reload} />
        </View>
      )}
      <View
        style={[styles.body, (isUpdating || didFail) && styles.updating]}
        testID={isUpdating ? 'rating-stats-updating' : undefined}
      >
        {stats.history.length > 0 ? (
          <View style={styles.chart}>
            <RatingChart
              history={stats.history}
              from={chartStart(stats, now)}
              to={now}
              testID="rating-chart"
            />
          </View>
        ) : (
          <EmptyState
            illustration="activity"
            title="No rated games"
            message={`${displayName}'s rating will be charted here once they play rated ${GAME_TYPE_LABELS[stats.rating.category]} games in this period.`}
            compact
            testID="rating-chart-empty"
          />
        )}
        <RatingHighLowCard highest={stats.highest} lowest={stats.lowest} />
        <CategoryStatsCard
          stats={stats}
          onOpenGame={(gameId) => navigation.navigate('GameViewer', { gameId })}
        />
      </View>
    </ScrollView>
  );
};

export default RatingStatsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    paddingTop: 32,
    backgroundColor: 'white',
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: MUTED_COLOR,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 32,
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
    color: MUTED_COLOR,
  },
  body: {
    gap: 16,
    paddingTop: 16,
  },
  updating: {
    opacity: 0.5,
  },
  failed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  failedText: {
    color: MUTED_COLOR,
  },
  chart: {
    marginHorizontal: 16,
  },
});

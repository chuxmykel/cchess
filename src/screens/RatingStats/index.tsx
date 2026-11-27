import { ReactNode, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { parseISO, subDays } from 'date-fns';

import Button from '../../components/Button';
import CategoryStatsCard from '../../components/CategoryStatsCard';
import EmptyState from '../../components/EmptyState';
import Placeholder from '../../components/Placeholder';
import PuzzleStatsCard from '../../components/PuzzleStatsCard';
import RatingCategoryIcon from '../../components/RatingCategoryIcon';
import RatingChange from '../../components/RatingChange';
import RatingChart from '../../components/RatingChart';
import RatingCategoryPicker from '../../components/RatingCategoryPicker';
import RatingHighLowCard from '../../components/RatingHighLowCard';
import SegmentedTabs from '../../components/SegmentedTabs';
import {
  type RatingCategory,
  ratingCategoryLabel,
} from '../../constants/ratingCategories';
import {
  DEFAULT_RATING_PERIOD,
  RATING_PERIOD_DAYS,
  RATING_PERIOD_LABELS,
} from '../../constants/ratingPeriods';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import { usePuzzleStats } from '../../hooks/usePuzzleStats';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useRatingStats } from '../../hooks/useRatingStats';
import {
  RATING_PERIODS,
  RatingPeriod,
  RatingPoint,
} from '../../network/restClient';
import { formatRating } from '../../utils/rating';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles } from '../../theme';

const PERIOD_CAPTIONS: Record<RatingPeriod, string> = {
  '1w': 'Past week',
  '1m': 'Past month',
  '3m': 'Past 3 months',
  '1y': 'Past year',
  all: 'All time',
};

/** Where the chart starts: the period's start, or for all time, the first
 * point charted. */
function chartStart(
  period: RatingPeriod,
  history: RatingPoint[],
  now: Date,
): Date {
  if (period === 'all') {
    return history.length > 0 ? parseISO(history[0].at) : now;
  }
  return subDays(now, RATING_PERIOD_DAYS[period]);
}

/** Whether there's a rating to chart: a period's rated games or tries, or
 * the rating it held all period - once there are any at all. All time with
 * none has no start to draw it from. */
function hasChart(
  period: RatingPeriod,
  history: RatingPoint[],
  everRated: boolean,
): boolean {
  if (history.length > 0) return true;
  return period !== 'all' && everRated;
}

type RatingStatsProps = Pick<
  HomeStackScreenProps<'RatingStats'>,
  'navigation' | 'route'
>;

// A player's rating in one category - a game type, or puzzles - over a
// period: the rating and what it gained, the chart, its highest and lowest,
// and the category's own stats. The header's title switches category.
const RatingStatsScreen: React.FC<RatingStatsProps> = ({
  navigation,
  route,
}) => {
  const { username, displayName, category } = route.params;
  const [period, setPeriod] = useState<RatingPeriod>(DEFAULT_RATING_PERIOD);

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

  return category === 'puzzles' ? (
    <PuzzleRatingStats
      username={username}
      displayName={displayName}
      period={period}
      onPeriod={setPeriod}
    />
  ) : (
    <GameRatingStats
      username={username}
      displayName={displayName}
      category={category}
      period={period}
      onPeriod={setPeriod}
      onOpenGame={(gameId) => navigation.navigate('GameViewer', { gameId })}
    />
  );
};

export default RatingStatsScreen;

type FrameProps = {
  category: RatingCategory;
  displayName: string;
  rating: string;
  ratingChange: number | null;
  // The period chosen, and that of the stats shown - the last one's, while
  // the chosen one loads.
  period: RatingPeriod;
  shownPeriod: RatingPeriod;
  onPeriod: (period: RatingPeriod) => void;
  isUpdating: boolean;
  didFail: boolean;
  reload: () => Promise<void>;
  children: ReactNode;
};

// What every category's stats share: the rating and what it gained over
// the period, the period's tabs, and the stats below, faded while another
// period's load.
function StatsFrame({
  category,
  displayName,
  rating,
  ratingChange,
  period,
  shownPeriod,
  onPeriod,
  isUpdating,
  didFail,
  reload,
  children,
}: FrameProps) {
  const styles = useStyles();
  const refresh = usePullToRefresh(reload);
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl {...refresh} />}
      testID="rating-stats-screen"
    >
      <View style={styles.header}>
        <RatingCategoryIcon category={category} size={28} />
        <View style={styles.headerText}>
          <Text style={styles.name}>
            {displayName} · {ratingCategoryLabel(category)}
          </Text>
          <View style={styles.ratingLine}>
            <Text style={styles.rating} testID="rating-stats-rating">
              {rating}
            </Text>
            {ratingChange !== null && (
              <RatingChange
                change={ratingChange}
                testID="rating-stats-change"
              />
            )}
          </View>
          <Text style={styles.caption}>{PERIOD_CAPTIONS[shownPeriod]}</Text>
        </View>
      </View>

      <SegmentedTabs<RatingPeriod>
        tabs={RATING_PERIODS.map((key) => ({
          key,
          label: RATING_PERIOD_LABELS[key],
        }))}
        selected={period}
        onSelect={onPeriod}
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
        {children}
      </View>
    </ScrollView>
  );
}

function StatsLoading() {
  const styles = useStyles();
  return (
    <View style={styles.loading} testID="rating-stats-loading">
      <Placeholder width="40%" height={36} />
      <Placeholder width="90%" height={160} />
      <Placeholder width="90%" height={80} />
    </View>
  );
}

function StatsError({ reload }: { reload: () => Promise<void> }) {
  const styles = useStyles();
  return (
    <View style={styles.error} testID="rating-stats-error">
      <Text style={styles.failedText}>{"These stats couldn't be loaded."}</Text>
      <Button label="Try again" variant="outline" onPress={reload} />
    </View>
  );
}

function GameRatingStats({
  username,
  displayName,
  category,
  period,
  onPeriod,
  onOpenGame,
}: {
  username: string;
  displayName: string;
  category: GameType;
  period: RatingPeriod;
  onPeriod: (period: RatingPeriod) => void;
  onOpenGame: (gameId: string) => void;
}) {
  const styles = useStyles();
  const { state, reload } = useRatingStats(username, category, period);
  if (state.status === 'loading') return <StatsLoading />;
  if (state.status === 'error') return <StatsError reload={reload} />;

  const { stats, isUpdating, didFail } = state;
  const now = new Date();
  return (
    <StatsFrame
      category={stats.rating.category}
      displayName={displayName}
      rating={formatRating(stats.rating.rating, stats.rating.provisional)}
      ratingChange={stats.ratingChange}
      period={period}
      shownPeriod={stats.period}
      onPeriod={onPeriod}
      isUpdating={isUpdating}
      didFail={didFail}
      reload={reload}
    >
      {hasChart(stats.period, stats.history, stats.rating.gamesPlayed > 0) ? (
        <View style={styles.chart}>
          <RatingChart
            history={stats.history}
            from={chartStart(stats.period, stats.history, now)}
            to={now}
            currentRating={stats.rating.rating}
            testID="rating-chart"
          />
        </View>
      ) : (
        <EmptyState
          illustration="activity"
          title="No rated games"
          message={`${displayName}'s rating will be charted here once they play rated ${GAME_TYPE_LABELS[stats.rating.category]} games.`}
          compact
          testID="rating-chart-empty"
        />
      )}
      <RatingHighLowCard highest={stats.highest} lowest={stats.lowest} />
      <CategoryStatsCard stats={stats} onOpenGame={onOpenGame} />
    </StatsFrame>
  );
}

function PuzzleRatingStats({
  username,
  displayName,
  period,
  onPeriod,
}: {
  username: string;
  displayName: string;
  period: RatingPeriod;
  onPeriod: (period: RatingPeriod) => void;
}) {
  const styles = useStyles();
  const { state, reload } = usePuzzleStats(username, period);
  if (state.status === 'loading') return <StatsLoading />;
  if (state.status === 'error') return <StatsError reload={reload} />;

  const { stats, isUpdating, didFail } = state;
  const now = new Date();
  return (
    <StatsFrame
      category="puzzles"
      displayName={displayName}
      rating={formatRating(stats.rating.rating, stats.rating.provisional)}
      ratingChange={stats.ratingChange}
      period={period}
      shownPeriod={stats.period}
      onPeriod={onPeriod}
      isUpdating={isUpdating}
      didFail={didFail}
      reload={reload}
    >
      {hasChart(stats.period, stats.history, stats.rating.attempts > 0) ? (
        <View style={styles.chart}>
          <RatingChart
            history={stats.history}
            from={chartStart(stats.period, stats.history, now)}
            to={now}
            currentRating={stats.rating.rating}
            testID="rating-chart"
          />
        </View>
      ) : (
        <EmptyState
          illustration="activity"
          title="No puzzles tried"
          message={`${displayName}'s puzzle rating will be charted here once they try practice puzzles.`}
          compact
          testID="rating-chart-empty"
        />
      )}
      <RatingHighLowCard
        highest={stats.highest}
        lowest={stats.lowest}
        emptyLabel="No puzzles tried"
      />
      <PuzzleStatsCard stats={stats} />
    </StatsFrame>
  );
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingBottom: t.spacing.xxl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    gap: t.spacing.lg,
    paddingTop: t.spacing.xxl,
    backgroundColor: t.colors.background,
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  rating: {
    color: t.colors.text,
    fontSize: t.fontSize.display,
    fontWeight: t.fontWeight.bold,
  },
  caption: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  body: {
    gap: t.spacing.lg,
    paddingTop: t.spacing.lg,
  },
  updating: {
    opacity: 0.5,
  },
  failed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xs,
    paddingTop: t.spacing.sm,
  },
  failedText: {
    color: t.colors.textMuted,
  },
  chart: {
    marginHorizontal: t.spacing.lg,
  },
}));

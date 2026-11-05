import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import EmptyState from '../EmptyState';
import GameTypeIcon from '../GameTypeIcon';
import RatingDiff from '../RatingDiff';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { ActivityDay } from '../../network/restClient';
import { makeStyles, useTheme } from '../../theme';

function playedLabel(day: ActivityDay): string {
  const category = GAME_TYPE_LABELS[day.category];
  return `Played ${day.games} ${category} ${day.games === 1 ? 'game' : 'games'}`;
}

interface ActivityListProps {
  activity: ActivityDay[];
  /** Says whose games would be here, when there are none. */
  emptyMessage: string;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activity,
  emptyMessage,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const resultColors = {
    wins: colors.results.win,
    draws: colors.results.draw,
    losses: colors.results.loss,
  };

  if (activity.length === 0) {
    return (
      <EmptyState
        illustration="activity"
        title="No recent activity"
        message={emptyMessage}
        compact
        testID="activity-empty"
      />
    );
  }
  return (
    <View style={styles.card} testID="activity-list">
      {activity.map((day, index) => {
        const isNewDate = index === 0 || activity[index - 1].date !== day.date;
        return (
          <Fragment key={`${day.date}-${day.category}`}>
            {isNewDate && (
              <Text style={styles.date}>
                {format(parseISO(day.date), 'MMM d, yyyy')}
              </Text>
            )}
            <View
              style={styles.row}
              testID={`activity-${day.date}-${day.category}`}
            >
              <GameTypeIcon type={day.category} size={20} />
              <View style={styles.details}>
                <Text style={styles.played}>{playedLabel(day)}</Text>
                {day.ratingAfter !== null && day.ratingDiff !== null && (
                  <View style={styles.rating}>
                    <Text style={styles.ratingText}>{day.ratingAfter}</Text>
                    <RatingDiff diff={day.ratingDiff} />
                  </View>
                )}
              </View>
              <View style={styles.results}>
                {(['wins', 'draws', 'losses'] as const).map(
                  (result) =>
                    day[result] > 0 && (
                      <Text
                        key={result}
                        style={[
                          styles.result,
                          { backgroundColor: resultColors[result] },
                        ]}
                      >
                        {day[result]}
                      </Text>
                    ),
                )}
              </View>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
};

export default ActivityList;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  date: {
    marginTop: t.spacing.md,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  details: {
    flex: 1,
  },
  played: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  ratingText: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  results: {
    flexDirection: 'row',
    gap: t.spacing.xs,
  },
  result: {
    minWidth: 22,
    paddingHorizontal: t.spacing.xs,
    paddingVertical: t.spacing.xxs,
    textAlign: 'center',
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.bold,
    overflow: 'hidden',
    borderRadius: t.radius.hairline,
  },
}));

import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import EmptyState from '../EmptyState';
import GameTypeIcon from '../GameTypeIcon';
import RatingDiff from '../RatingDiff';
import { MUTED_COLOR } from '../../constants/colors';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { ActivityDay } from '../../network/restClient';

const RESULT_COLORS = { wins: '#5a9e2f', draws: '#c99a1c', losses: '#c8402a' };

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
                          { backgroundColor: RESULT_COLORS[result] },
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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  date: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#c99a1c',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  details: {
    flex: 1,
  },
  played: {
    fontSize: 14,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: MUTED_COLOR,
  },
  results: {
    flexDirection: 'row',
    gap: 3,
  },
  result: {
    minWidth: 22,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    borderRadius: 3,
  },
});

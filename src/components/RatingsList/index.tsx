import { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import { UserRating } from '../../network/restClient';
import { formatRating } from '../../utils/rating';

interface RatingsListProps {
  ratings: UserRating[];
}

const CATEGORIES: GameType[] = ['bullet', 'blitz', 'rapid', 'classical'];

function gamesPlayedLabel(gamesPlayed: number): string {
  return gamesPlayed === 1 ? '1 game' : `${gamesPlayed} games`;
}

const RatingsList: React.FC<RatingsListProps> = ({ ratings }) => (
  <View style={styles.card}>
    {CATEGORIES.map((category, index) => {
      const rating = ratings.find((each) => each.category === category);
      return (
        <Fragment key={category}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.row} testID={`rating-${category}`}>
            <GameTypeIcon type={category} />
            <Text style={styles.category}>{GAME_TYPE_LABELS[category]}</Text>
            <Text style={styles.gamesPlayed}>
              {rating ? gamesPlayedLabel(rating.gamesPlayed) : 'No games yet'}
            </Text>
            <Text style={styles.rating}>
              {rating ? formatRating(rating.rating, rating.provisional) : '—'}
            </Text>
          </View>
        </Fragment>
      );
    })}
  </View>
);

export default RatingsList;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  category: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  gamesPlayed: {
    fontSize: 13,
    color: '#888',
  },
  rating: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
});

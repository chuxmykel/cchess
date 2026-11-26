import { Fragment } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import { UserProfile, UserRating } from '../../network/restClient';
import { formatRating } from '../../utils/rating';
import { makeStyles, useTheme } from '../../theme';

interface RatingsListProps {
  ratings: UserRating[];
  /** Makes each rated category's row open its stats. */
  onSelect?: (category: GameType) => void;
  /** Their puzzle rating, a last row that opens nothing - there are no
   * stats for it yet. Left out, there's no row. */
  puzzleRating?: UserProfile['puzzleRating'];
}

const CATEGORIES: GameType[] = [
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'daily',
];

function gamesPlayedLabel(gamesPlayed: number): string {
  return gamesPlayed === 1 ? '1 game' : `${gamesPlayed} games`;
}

function puzzlesLabel(attempts: number): string {
  return attempts === 1 ? '1 puzzle' : `${attempts} puzzles`;
}

const RatingsList: React.FC<RatingsListProps> = ({
  ratings,
  onSelect,
  puzzleRating,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      {CATEGORIES.map((category, index) => {
        const rating = ratings.find((each) => each.category === category);
        return (
          <Fragment key={category}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              style={styles.row}
              onPress={
                rating && onSelect ? () => onSelect(category) : undefined
              }
              disabled={!rating || !onSelect}
              accessibilityRole={rating && onSelect ? 'button' : undefined}
              testID={`rating-${category}`}
            >
              <GameTypeIcon type={category} />
              <Text style={styles.category}>{GAME_TYPE_LABELS[category]}</Text>
              <Text style={styles.gamesPlayed}>
                {rating ? gamesPlayedLabel(rating.gamesPlayed) : 'No games yet'}
              </Text>
              <Text style={styles.rating}>
                {rating ? formatRating(rating.rating, rating.provisional) : '—'}
              </Text>
              {onSelect && (
                <Icon
                  name="chevron-right"
                  size={18}
                  color={rating ? colors.textMuted : 'transparent'}
                />
              )}
            </Pressable>
          </Fragment>
        );
      })}
      {puzzleRating !== undefined && (
        <>
          <View style={styles.divider} />
          <View style={styles.row} testID="rating-puzzles">
            <Icon name="puzzle" size={18} color={colors.accent} />
            <Text style={styles.category}>Puzzles</Text>
            <Text style={styles.gamesPlayed}>
              {puzzleRating
                ? puzzlesLabel(puzzleRating.attempts)
                : 'No puzzles yet'}
            </Text>
            <Text style={styles.rating}>
              {puzzleRating
                ? formatRating(puzzleRating.rating, puzzleRating.provisional)
                : '—'}
            </Text>
            {onSelect && (
              <Icon name="chevron-right" size={18} color="transparent" />
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default RatingsList;

const useStyles = makeStyles((t) => ({
  card: {
    marginHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  category: {
    color: t.colors.text,
    flex: 1,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  gamesPlayed: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  rating: {
    color: t.colors.text,
    minWidth: 48,
    textAlign: 'right',
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
}));

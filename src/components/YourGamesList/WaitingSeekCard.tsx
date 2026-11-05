import { Pressable, Text, View } from 'react-native';

import { EmptyBoard } from '../Board';
import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import { daysLabel } from '../../constants/timeControls';
import { DailySeek } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { DAILY_GAME_BOARD_WIDTH, DAILY_GAME_CARD_WIDTH } from './DailyGameCard';

interface WaitingSeekCardProps {
  seek: DailySeek;
  onCancel: (seek: DailySeek) => void;
}

// A daily seek still waiting for an opponent, the size of a game's card -
// an empty board where its game will be - with ✕ to withdraw it.
const WaitingSeekCard: React.FC<WaitingSeekCardProps> = ({
  seek,
  onCancel,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID={`daily-seek-${seek.id}`}>
      <View style={styles.board} pointerEvents="none">
        <EmptyBoard width={DAILY_GAME_BOARD_WIDTH} />
      </View>
      <Pressable
        style={styles.cancel}
        onPress={() => onCancel(seek)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Stop looking for an opponent"
        testID={`daily-seek-${seek.id}-cancel`}
      >
        <Icon name="close" size={16} />
      </Pressable>
      <View style={styles.footer}>
        <GameTypeIcon type="daily" size={20} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            Finding opponent
          </Text>
          <Text style={styles.subtitle}>
            {daysLabel(seek.days)}
            {seek.rated ? '' : ' · Casual'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default WaitingSeekCard;

const useStyles = makeStyles((t) => ({
  card: {
    width: DAILY_GAME_CARD_WIDTH,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: t.colors.surface,
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
  },
  board: {
    opacity: 0.5,
  },
  cancel: {
    position: 'absolute',
    top: t.spacing.md,
    right: t.spacing.md,
    padding: t.spacing.xxs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginTop: t.spacing.sm,
  },
  text: {
    flex: 1,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
  },
  subtitle: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.xs,
  },
}));

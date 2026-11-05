import { Text, View } from 'react-native';

import Avatar from '../Avatar';
import CircleIconButton from '../CircleIconButton';
import GameTypeIcon from '../GameTypeIcon';
import { timeControlOf } from '../../constants/timeControls';
import { useFirstMoveCountdown } from '../../hooks/useFirstMoveCountdown';
import { Challenge } from '../../network/restClient';
import { makeStyles } from '../../theme';

type ChallengeCardProps =
  | {
      challenge: Challenge;
      direction: 'incoming';
      onAccept: () => void;
      onDecline: () => void;
    }
  | { challenge: Challenge; direction: 'outgoing'; onCancel: () => void };

const ChallengeCard: React.FC<ChallengeCardProps> = (props) => {
  const styles = useStyles();

  const { challenge, direction } = props;
  const secondsLeft = useFirstMoveCountdown(challenge.expiresAt);
  if (secondsLeft === 0) {
    return null;
  }
  const other =
    direction === 'incoming' ? challenge.challenger : challenge.opponent;
  const timeControl = timeControlOf(challenge);

  return (
    <View style={styles.card} testID={`challenge-card-${challenge.id}`}>
      <Avatar name={other.displayName} color={other.avatarColor} size={40} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {direction === 'incoming'
            ? `${other.displayName} challenges you`
            : `Waiting for ${other.displayName}`}
        </Text>
        <View style={styles.subtitleRow}>
          <GameTypeIcon type={challenge.gameType} size={14} />
          <Text style={styles.subtitle}>
            {timeControl.label} • {challenge.rated ? 'Rated' : 'Casual'}
            {secondsLeft !== null && ` • ${secondsLeft}s`}
          </Text>
        </View>
      </View>
      {props.direction === 'incoming' ? (
        <View style={styles.actions}>
          <CircleIconButton
            icon="close"
            label="Decline"
            onPress={props.onDecline}
            testID={`decline-challenge-${challenge.id}`}
          />
          <CircleIconButton
            icon="check"
            label="Accept"
            variant="primary"
            onPress={props.onAccept}
            testID={`accept-challenge-${challenge.id}`}
          />
        </View>
      ) : (
        <CircleIconButton
          icon="close"
          label="Cancel"
          onPress={props.onCancel}
          testID={`cancel-challenge-${challenge.id}`}
        />
      )}
    </View>
  );
};

export default ChallengeCard;

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  details: {
    flex: 1,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    marginTop: t.spacing.xxs,
  },
  subtitle: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
}));

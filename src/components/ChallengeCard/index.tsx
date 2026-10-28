import { StyleSheet, Text, View } from 'react-native';

import Avatar from '../Avatar';
import CircleIconButton from '../CircleIconButton';
import GameTypeIcon from '../GameTypeIcon';
import { MUTED_COLOR } from '../../constants/colors';
import { findTimeControl } from '../../constants/timeControls';
import { useFirstMoveCountdown } from '../../hooks/useFirstMoveCountdown';
import { Challenge } from '../../network/restClient';

type ChallengeCardProps =
  | {
      challenge: Challenge;
      direction: 'incoming';
      onAccept: () => void;
      onDecline: () => void;
    }
  | { challenge: Challenge; direction: 'outgoing'; onCancel: () => void };

const ChallengeCard: React.FC<ChallengeCardProps> = (props) => {
  const { challenge, direction } = props;
  const secondsLeft = useFirstMoveCountdown(challenge.expiresAt);
  if (secondsLeft === 0) {
    return null;
  }
  const other =
    direction === 'incoming' ? challenge.challenger : challenge.opponent;
  const timeControl = findTimeControl(
    challenge.initialSeconds,
    challenge.incrementSeconds,
    challenge.gameType,
  );

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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MUTED_COLOR,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

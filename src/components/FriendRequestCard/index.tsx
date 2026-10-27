import { StyleSheet, Text, View } from 'react-native';

import Avatar from '../Avatar';
import CircleIconButton from '../CircleIconButton';
import { MUTED_COLOR } from '../../constants/colors';
import { FriendRequest } from '../../network/restClient';

type FriendRequestCardProps =
  | {
      request: FriendRequest;
      direction: 'incoming';
      onAccept: () => void;
      onDecline: () => void;
    }
  | { request: FriendRequest; direction: 'outgoing'; onCancel: () => void };

const FriendRequestCard: React.FC<FriendRequestCardProps> = (props) => {
  const { request } = props;
  const { user } = request;
  return (
    <View style={styles.card} testID={`friend-request-${request.id}`}>
      <Avatar name={user.displayName} color={user.avatarColor} size={40} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {props.direction === 'incoming'
            ? 'Wants to be friends'
            : 'Friend request sent'}
        </Text>
      </View>
      {props.direction === 'incoming' ? (
        <View style={styles.actions}>
          <CircleIconButton
            icon="close"
            label="Decline"
            onPress={props.onDecline}
            testID={`decline-friend-${request.id}`}
          />
          <CircleIconButton
            icon="check"
            label="Accept"
            variant="primary"
            onPress={props.onAccept}
            testID={`accept-friend-${request.id}`}
          />
        </View>
      ) : (
        <CircleIconButton
          icon="close"
          label="Cancel"
          onPress={props.onCancel}
          testID={`cancel-friend-${request.id}`}
        />
      )}
    </View>
  );
};

export default FriendRequestCard;

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
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED_COLOR,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

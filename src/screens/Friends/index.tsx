import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChallengeSheet from '../../components/ChallengeSheet';
import FriendRequestCard from '../../components/FriendRequestCard';
import FriendRow from '../../components/FriendRow';
import SegmentedTabs from '../../components/SegmentedTabs';
import TextField from '../../components/TextField';
import Toast from '../../components/Toast';
import { MUTED_COLOR } from '../../constants/colors';
import { FRIEND_ACTION_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useSocialContext } from '../../context/SocialContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFriendActions } from '../../hooks/useFriendActions';
import { useToast } from '../../hooks/useToast';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';
import { HomeTabStackScreenProps } from '../HomeTabStack/types';

type FriendsTab = 'online' | 'all' | 'requests';

function counted(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

type FriendsProps = Pick<HomeTabStackScreenProps<'Friends'>, 'navigation'>;

const Friends: React.FC<FriendsProps> = ({ navigation }) => {
  const social = useSocialContext();
  const toast = useToast();
  const friendActions = useFriendActions(navigation, (friend) =>
    toast.show(`Challenge sent to ${friend.displayName}`),
  );
  const [tab, setTab] = useState<FriendsTab>('online');
  useFocusEffect(social.reload);
  const [username, setUsername] = useState('');
  const addFriend = useAsyncAction(async () => {
    await social.sendFriendRequest(username.trim());
    setUsername('');
    toast.show('Friend request sent');
  }, FRIEND_ACTION_FAILED_MESSAGE);

  const friends = [...(social.friends ?? [])].sort(byPresence);
  const onlineFriends = friends.filter(
    (friend) => friend.online || friend.playingGameId,
  );
  const { incoming, outgoing } = social.requests;
  const requestCount = incoming.length + outgoing.length;

  function showErrorOf(action: Promise<void>) {
    action.catch((error: Error) => toast.show(error.message));
  }

  function confirmRemove(friend: Friend) {
    Alert.alert(
      `Remove ${friend.displayName}?`,
      'You can send them a friend request again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => showErrorOf(social.removeFriend(friend.username)),
        },
      ],
    );
  }

  function renderFriend({ item }: { item: Friend }) {
    return (
      <FriendRow
        friend={item}
        onPress={friendActions.openProfile}
        menuItems={[
          {
            label: 'Message',
            icon: 'message-outline',
            onPress: () => friendActions.message(item),
          },
          {
            label: 'Challenge',
            icon: 'sword-cross',
            onPress: () => friendActions.startChallenge(item),
          },
          {
            label: 'Remove friend',
            icon: 'account-remove-outline',
            onPress: () => confirmRemove(item),
            testID: `remove-friend-${item.id}`,
          },
        ]}
      />
    );
  }

  function renderRequests() {
    if (requestCount === 0) {
      return <Text style={styles.empty}>No friend requests.</Text>;
    }
    return (
      <View style={styles.requests}>
        {incoming.map((request) => (
          <FriendRequestCard
            key={request.id}
            request={request}
            direction="incoming"
            onAccept={() =>
              showErrorOf(social.respondToFriendRequest(request.id, true))
            }
            onDecline={() =>
              showErrorOf(social.respondToFriendRequest(request.id, false))
            }
          />
        ))}
        {outgoing.map((request) => (
          <FriendRequestCard
            key={request.id}
            request={request}
            direction="outgoing"
            onCancel={() => showErrorOf(social.cancelFriendRequest(request.id))}
          />
        ))}
      </View>
    );
  }

  const shownFriends = tab === 'online' ? onlineFriends : friends;

  return (
    <View style={styles.screen} testID="friends-screen">
      <View style={styles.addFriend}>
        <View style={styles.addFriendField}>
          <TextField
            label="Add a friend"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={addFriend.run}
            testID="add-friend-input"
          />
        </View>
        <Button
          label="Add"
          onPress={addFriend.run}
          disabled={!username.trim() || addFriend.isRunning}
          testID="add-friend-button"
        />
      </View>
      {addFriend.errorMessage && (
        <Text style={styles.error} testID="add-friend-error">
          {addFriend.errorMessage}
        </Text>
      )}
      <SegmentedTabs<FriendsTab>
        tabs={[
          { key: 'online', label: `${onlineFriends.length} online` },
          { key: 'all', label: counted(friends.length, 'friend') },
          { key: 'requests', label: counted(requestCount, 'request') },
        ]}
        selected={tab}
        onSelect={setTab}
      />
      {tab === 'requests' ? (
        renderRequests()
      ) : (
        <FlatList
          data={shownFriends}
          keyExtractor={(friend) => friend.id}
          renderItem={renderFriend}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'online' ? 'No friends online.' : 'No friends yet.'}
            </Text>
          }
        />
      )}
      <ChallengeSheet
        opponentName={friendActions.challengeTarget?.displayName ?? null}
        canPlayRated={friendActions.canPlayRated}
        onClose={friendActions.closeChallenge}
        onSend={friendActions.sendChallenge}
      />
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default Friends;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  addFriend: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 16,
  },
  addFriendField: {
    flex: 1,
  },
  error: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#d33',
  },
  requests: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
});

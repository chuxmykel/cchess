import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import ChallengeSheet from '../../components/ChallengeSheet';
import EmptyState from '../../components/EmptyState';
import FriendRequestCard from '../../components/FriendRequestCard';
import FriendRow from '../../components/FriendRow';
import SegmentedTabs from '../../components/SegmentedTabs';
import Toast from '../../components/Toast';
import UserSearchField from '../../components/UserSearchField';
import { useSocialContext } from '../../context/SocialContext';
import { useFriendActions } from '../../hooks/useFriendActions';
import { useToast } from '../../hooks/useToast';
import { useUserSearch } from '../../hooks/useUserSearch';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';
import { HomeTabStackScreenProps } from '../HomeTabStack/types';

type FriendsTab = 'online' | 'all' | 'requests';

function counted(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

type FriendsProps = Pick<
  HomeTabStackScreenProps<'Friends'>,
  'navigation' | 'route'
>;

const Friends: React.FC<FriendsProps> = ({ navigation, route }) => {
  const social = useSocialContext();
  const toast = useToast();
  const friendActions = useFriendActions(navigation, (friend) =>
    toast.show(`Challenge sent to ${friend.displayName}`),
  );
  const [tab, setTab] = useState<FriendsTab>('online');
  useFocusEffect(social.reload);
  const [searchQuery, setSearchQuery] = useState('');
  const userSearch = useUserSearch(searchQuery);

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
      return (
        <EmptyState
          illustration="notifications"
          title="No friend requests"
          message="Requests you send and receive will show up here."
          testID="requests-empty"
        />
      );
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
      <View style={styles.search}>
        <UserSearchField
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          search={userSearch}
          autoFocus={route.params?.focusSearch}
          onSelect={(user) =>
            navigation.navigate('UserProfile', { username: user.username })
          }
        />
      </View>
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
            tab === 'online' ? (
              <EmptyState
                illustration="friends"
                title={
                  friends.length === 0 ? 'Add some friends' : "Nobody's online"
                }
                message={
                  friends.length === 0
                    ? 'Friends who are online will show up on this tab. Search for players above to add some.'
                    : 'Friends who are online right now will show up here.'
                }
                testID="online-empty"
              />
            ) : (
              <EmptyState
                illustration="friends"
                title="No friends yet"
                message="Your friends will show up here once you connect. Search for players above to add some."
                testID="all-friends-empty"
              />
            )
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
  search: {
    padding: 16,
    zIndex: 1,
  },
  requests: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
});

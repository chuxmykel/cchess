import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import FriendRow from '../../components/FriendRow';
import FriendListControls from '../../components/FriendListControls';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useUserFriends } from '../../hooks/useUserFriends';
import { FriendSort, isAround, sortFriends } from '../../utils/friendSort';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles } from '../../theme';

type UserFriendsProps = Pick<
  HomeStackScreenProps<'UserFriends'>,
  'navigation' | 'route'
>;

// Everyone a player is friends with - or only those online - sorted online
// first, by name, or the most recently added first.
const UserFriends: React.FC<UserFriendsProps> = ({ navigation, route }) => {
  const styles = useStyles();

  const { username, displayName } = route.params;
  const { state, reload } = useUserFriends(username);
  const refresh = usePullToRefresh(reload);
  const [sort, setSort] = useState<FriendSort>('online');
  const [onlineOnly, setOnlineOnly] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${displayName}'s friends` });
  }, [navigation, displayName]);

  if (state.status === 'loading') {
    return (
      <ActivityIndicator style={styles.loading} testID="user-friends-loading" />
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.message} testID="user-friends-error">
        <Text style={styles.messageText}>{"Couldn't load the friends."}</Text>
        <Button label="Try again" variant="outline" onPress={reload} />
      </View>
    );
  }

  const online = state.friends.filter(isAround);
  const shown = onlineOnly ? online : state.friends;

  return (
    <View style={styles.screen}>
      {state.friends.length > 0 && (
        <FriendListControls
          sort={sort}
          onSortChange={setSort}
          onlineOnly={onlineOnly}
          onOnlineOnlyChange={setOnlineOnly}
          onlineCount={online.length}
        />
      )}
      <FlatList
        data={sortFriends(shown, sort)}
        refreshControl={<RefreshControl {...refresh} />}
        keyExtractor={(friend) => friend.id}
        renderItem={({ item }) => (
          <FriendRow
            friend={item}
            onPress={(friend) =>
              navigation.push('UserProfile', { username: friend.username })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          onlineOnly ? (
            <EmptyState
              illustration="friends"
              title="Nobody online"
              message={`None of ${displayName}'s friends are online right now.`}
              testID="user-friends-none-online"
            />
          ) : (
            <EmptyState
              illustration="friends"
              title="No friends yet"
              message={`${displayName}'s friends will show up here.`}
              testID="user-friends-empty"
            />
          )
        }
        testID="user-friends-list"
      />
    </View>
  );
};

export default UserFriends;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  loading: {
    marginTop: t.spacing.xxl,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
  },
  messageText: {
    color: t.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
}));

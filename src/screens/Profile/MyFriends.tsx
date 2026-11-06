import ProfileFriends from '../../components/ProfileFriends';
import { UserFriendsState } from '../../hooks/useUserFriends';
import { HomeStackParamList } from '../HomeStack/types';

export interface MyFriendsNavigation {
  navigate: {
    (route: 'UserProfile', params: HomeStackParamList['UserProfile']): void;
    (route: 'UserFriends', params: HomeStackParamList['UserFriends']): void;
    (route: 'FindFriends', params: HomeStackParamList['FindFriends']): void;
  };
}

interface MyFriendsProps {
  username: string;
  displayName: string;
  /** Yours, which Profile keeps current. */
  state: UserFriendsState;
  navigation: MyFriendsNavigation;
}

// The Profile tab's Friends section: your friends, and the way to add more.
const MyFriends: React.FC<MyFriendsProps> = ({
  username,
  displayName,
  state,
  navigation,
}) => {
  const friends = state.status === 'ready' ? state.friends : null;

  return (
    <ProfileFriends
      count={friends?.length}
      friends={friends}
      emptyMessage="Your friends will show up here. Add some to message and challenge them."
      onSelect={(friend) =>
        navigation.navigate('UserProfile', { username: friend.username })
      }
      onViewAll={() =>
        navigation.navigate('UserFriends', { username, displayName })
      }
      onAddFriends={() =>
        navigation.navigate('FindFriends', { focusSearch: true })
      }
    />
  );
};

export default MyFriends;

import { useFocusEffect } from '@react-navigation/native';

import ProfileFriends from '../../components/ProfileFriends';
import { useUserFriends } from '../../hooks/useUserFriends';
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
  navigation: MyFriendsNavigation;
}

// The Profile tab's Friends section: your friends, kept current each time
// the tab is shown, and the way to add more.
const MyFriends: React.FC<MyFriendsProps> = ({
  username,
  displayName,
  navigation,
}) => {
  const { state, reload } = useUserFriends(username);
  useFocusEffect(reload);
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

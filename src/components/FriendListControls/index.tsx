import { View } from 'react-native';

import ListControls from '../ListControls';
import { FRIEND_SORTS, FriendSort } from '../../utils/friendSort';
import { makeStyles } from '../../theme';

interface FriendListControlsProps {
  sort: FriendSort;
  onSortChange: (sort: FriendSort) => void;
  onlineOnly: boolean;
  onOnlineOnlyChange: (onlineOnly: boolean) => void;
  /** How many are online, shown on the filter. */
  onlineCount: number;
}

// Above a friends list: an "Online" filter and a dropdown of the orders.
const FriendListControls: React.FC<FriendListControlsProps> = ({
  sort,
  onSortChange,
  onlineOnly,
  onOnlineOnlyChange,
  onlineCount,
}) => {
  const styles = useStyles();
  return (
    <ListControls
      filter={{
        label: `Online ${onlineCount}`,
        selected: onlineOnly,
        onChange: onOnlineOnlyChange,
        leading: <View style={styles.onlineDot} />,
        testID: 'friends-online-filter',
      }}
      sorts={FRIEND_SORTS}
      sort={sort}
      onSortChange={onSortChange}
      testID="friends"
    />
  );
};

export default FriendListControls;

const useStyles = makeStyles((t) => ({
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.accent,
  },
}));

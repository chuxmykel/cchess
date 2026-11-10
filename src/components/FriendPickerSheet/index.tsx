import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import EmptyState from '../EmptyState';
import FriendRow from '../FriendRow';
import TextField from '../TextField';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';
import { makeStyles } from '../../theme';

interface FriendPickerSheetProps {
  visible: boolean;
  title: string;
  /** Null while they're still coming. */
  friends: Friend[] | null;
  onPick: (friend: Friend) => void;
  onClose: () => void;
}

/** Friends whose name or username has `query` in it, around first. */
export function matchingFriends(friends: Friend[], query: string): Friend[] {
  const wanted = query.trim().toLowerCase();
  return friends
    .filter(
      (friend) =>
        !wanted ||
        friend.displayName.toLowerCase().includes(wanted) ||
        friend.username.toLowerCase().includes(wanted),
    )
    .sort(byPresence);
}

// A friend to message, or to send a game or position to: every friend, the
// ones around first, narrowed by what's typed.
const FriendPickerSheet: React.FC<FriendPickerSheetProps> = ({
  visible,
  title,
  friends,
  onPick,
  onClose,
}) => {
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const shown = matchingFriends(friends ?? [], query);

  function close() {
    setQuery('');
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={close} heightRatio={0.8}>
      <View style={styles.sheet} testID="friend-picker">
        <Text style={styles.title}>{title}</Text>
        <TextField
          label="To"
          value={query}
          onChangeText={setQuery}
          placeholder="Search friends"
          returnKeyType="search"
          testID="friend-picker-search"
        />
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {friends && friends.length === 0 ? (
            <EmptyState
              illustration="friends"
              title="No friends yet"
              message="Add friends to message them and send them games."
              compact
            />
          ) : (
            shown.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onPress={(picked) => {
                  setQuery('');
                  onPick(picked);
                }}
              />
            ))
          )}
          {friends && friends.length > 0 && shown.length === 0 && (
            <Text style={styles.none}>No friends match “{query.trim()}”</Text>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default FriendPickerSheet;

const useStyles = makeStyles((t) => ({
  sheet: {
    flex: 1,
    gap: t.spacing.md,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
  },
  list: {
    flex: 1,
    marginHorizontal: -t.spacing.lg,
  },
  none: {
    color: t.colors.textMuted,
    textAlign: 'center',
    marginTop: t.spacing.lg,
  },
}));

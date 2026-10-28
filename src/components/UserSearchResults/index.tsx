import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Avatar from '../Avatar';
import { MUTED_COLOR } from '../../constants/colors';
import { UserSearch } from '../../hooks/useUserSearch';
import { UserSearchResult } from '../../network/restClient';

interface UserSearchResultsProps {
  /** What was searched for, to say when nothing matched. */
  query: string;
  search: Exclude<UserSearch, { status: 'idle' }>;
  onSelect: (user: UserSearchResult) => void;
}

// The players matching a search, as a list filling the screen under the
// search box: it scrolls clear of the keyboard, dragging it closes the
// keyboard, and nearing the end fetches the next page.
const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  query,
  search,
  onSelect,
}) => {
  if (search.status === 'searching') {
    return (
      <ActivityIndicator style={styles.loading} testID="user-search-loading" />
    );
  }
  if (search.status === 'error') {
    return (
      <Text style={styles.message} testID="user-search-error">
        {"Couldn't search right now. Try again in a moment."}
      </Text>
    );
  }

  function select(user: UserSearchResult) {
    Keyboard.dismiss();
    onSelect(user);
  }

  return (
    <FlatList
      data={search.results}
      keyExtractor={(user) => user.id}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => select(item)}
          accessibilityRole="button"
          testID={`user-search-result-${item.username}`}
        >
          <Avatar name={item.displayName} color={item.avatarColor} size={40} />
          <View style={styles.names}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{item.username}
            </Text>
          </View>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      onEndReached={search.loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        search.isLoadingMore ? (
          <ActivityIndicator style={styles.more} testID="user-search-more" />
        ) : null
      }
      ListEmptyComponent={
        <Text style={styles.message} testID="user-search-empty">
          No players match “{query.trim()}”.
        </Text>
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      testID="user-search-results"
    />
  );
};

export default UserSearchResults;

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
  },
  message: {
    padding: 24,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pressed: {
    backgroundColor: '#f2f2f2',
  },
  names: {
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED_COLOR,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
  more: {
    marginVertical: 16,
  },
});

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
import { UserSearch } from '../../hooks/useUserSearch';
import { UserSearchResult } from '../../network/restClient';
import { makeStyles } from '../../theme';

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
  const styles = useStyles();

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

const useStyles = makeStyles((t) => ({
  loading: {
    marginTop: t.spacing.xl,
  },
  message: {
    padding: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  pressed: {
    backgroundColor: t.colors.surface,
  },
  names: {
    flex: 1,
  },
  displayName: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  username: {
    marginTop: t.spacing.xxs,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
  more: {
    marginVertical: t.spacing.lg,
  },
}));

import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Avatar from '../Avatar';
import Icon from '../Icon';
import TextField from '../TextField';
import { MUTED_COLOR } from '../../constants/colors';
import { UserSearch } from '../../hooks/useUserSearch';
import { UserSearchResult } from '../../network/restClient';

interface UserSearchFieldProps {
  query: string;
  onChangeQuery: (query: string) => void;
  search: UserSearch;
  onSelect: (user: UserSearchResult) => void;
  autoFocus?: boolean;
}

const UserSearchField: React.FC<UserSearchFieldProps> = ({
  query,
  onChangeQuery,
  search,
  onSelect,
  autoFocus,
}) => {
  function select(user: UserSearchResult) {
    Keyboard.dismiss();
    onChangeQuery('');
    onSelect(user);
  }

  return (
    <View style={styles.container}>
      <TextField
        label="Find players"
        placeholder="Search by username"
        value={query}
        onChangeText={onChangeQuery}
        returnKeyType="search"
        autoFocus={autoFocus}
        testID="user-search-input"
        trailing={
          query.length > 0 ? (
            <Pressable
              onPress={() => onChangeQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID="user-search-clear"
            >
              <Icon name="close-circle" size={18} color={MUTED_COLOR} />
            </Pressable>
          ) : (
            <Icon name="magnify" size={20} color={MUTED_COLOR} />
          )
        }
      />
      {search.status !== 'idle' && (
        <View style={styles.dropdown} testID="user-search-results">
          {search.status === 'searching' && (
            <View style={styles.message}>
              <ActivityIndicator size="small" />
            </View>
          )}
          {search.status === 'error' && (
            <Text style={styles.messageText}>
              {"Couldn't search right now. Try again in a moment."}
            </Text>
          )}
          {search.status === 'done' && search.results.length === 0 && (
            <Text style={styles.messageText} testID="user-search-empty">
              No players match “{query.trim()}”.
            </Text>
          )}
          {search.status === 'done' &&
            search.results.map((user) => (
              <Pressable
                key={user.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => select(user)}
                accessibilityRole="button"
                testID={`user-search-result-${user.username}`}
              >
                <Avatar
                  name={user.displayName}
                  color={user.avatarColor}
                  size={32}
                />
                <View style={styles.names}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text style={styles.username} numberOfLines={1}>
                    @{user.username}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>
      )}
    </View>
  );
};

export default UserSearchField;

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  message: {
    padding: 16,
  },
  messageText: {
    padding: 16,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
    color: MUTED_COLOR,
  },
});

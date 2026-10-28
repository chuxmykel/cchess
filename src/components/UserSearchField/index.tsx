import { Pressable } from 'react-native';

import Icon from '../Icon';
import TextField from '../TextField';
import { MUTED_COLOR } from '../../constants/colors';

interface UserSearchFieldProps {
  query: string;
  onChangeQuery: (query: string) => void;
  autoFocus?: boolean;
}

/** Friends' player search box; its matches show in UserSearchResults. */
const UserSearchField: React.FC<UserSearchFieldProps> = ({
  query,
  onChangeQuery,
  autoFocus,
}) => {
  return (
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
  );
};

export default UserSearchField;

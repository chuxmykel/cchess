import { Pressable } from 'react-native';

import Icon from '../Icon';
import TextField from '../TextField';
import { useTheme } from '../../theme';

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
  const { colors } = useTheme();

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
            <Icon name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Icon name="magnify" size={20} color={colors.textMuted} />
        )
      }
    />
  );
};

export default UserSearchField;

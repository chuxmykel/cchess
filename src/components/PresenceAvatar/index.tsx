import { View } from 'react-native';

import Avatar from '../Avatar';
import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

/** Whether someone's around: online, in a game, or neither. */
export type Presence = 'online' | 'playing' | null;

/** A friend's presence from their live status. */
export function presenceOf(
  friend: { online: boolean; playingGameId: string | null } | undefined,
): Presence {
  if (!friend) return null;
  if (friend.playingGameId) return 'playing';
  return friend.online ? 'online' : null;
}

interface PresenceAvatarProps {
  name: string;
  color: string;
  size?: number;
  presence: Presence;
  testID?: string;
}

// An avatar with a dot on its corner while they're online, or a knight
// while they're playing.
const PresenceAvatar: React.FC<PresenceAvatarProps> = ({
  name,
  color,
  size = 48,
  presence,
  testID,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const badge = Math.round(size * 0.34);
  return (
    <View testID={testID}>
      <Avatar name={name} color={color} size={size} />
      {presence && (
        <View
          style={[
            styles.badge,
            { width: badge, height: badge, borderRadius: badge / 2 },
          ]}
          accessibilityLabel={presence === 'playing' ? 'Playing' : 'Online'}
          testID={testID && `${testID}-${presence}`}
        >
          {presence === 'playing' && (
            <Icon
              name="chess-knight"
              size={badge - 6}
              color={colors.textOnAccent}
            />
          )}
        </View>
      )}
    </View>
  );
};

export default PresenceAvatar;

const useStyles = makeStyles((t) => ({
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.colors.background,
    backgroundColor: t.colors.accent,
  },
}));

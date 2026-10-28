import { View, Text, Image, StyleSheet } from 'react-native';

import Icon from '../Icon';

interface AvatarProps {
  size?: number;
  name?: string;
  color?: string;
  imageUri?: string;
  /** A square with slightly rounded corners instead of a circle. */
  square?: boolean;
  /** Lifts the initials this many points, clear of something drawn over
   * the avatar's bottom. */
  raiseInitials?: number;
}

const DEFAULT_SIZE = 36;
const SQUARE_CORNER_RATIO = 0.15;

function getInitials(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  size = DEFAULT_SIZE,
  name,
  color,
  imageUri,
  square = false,
  raiseInitials = 0,
}) => {
  const dimensions = {
    width: size,
    height: size,
    borderRadius: square ? size * SQUARE_CORNER_RATIO : size / 2,
  };

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.avatar, dimensions]}
        testID="avatar-image"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.placeholder,
        color && { backgroundColor: color },
        dimensions,
      ]}
      testID="avatar-placeholder"
    >
      {name ? (
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.4 },
            raiseInitials > 0 && {
              transform: [{ translateY: -raiseInitials }],
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <Icon
          name="account"
          size={size * 0.6}
          color="white"
          testID="avatar-guest-icon"
        />
      )}
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#769656',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: '600',
  },
});

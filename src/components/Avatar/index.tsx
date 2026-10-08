import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  size?: number;
  name?: string;
  imageUri?: string;
}

const DEFAULT_SIZE = 36;

function getInitials(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  size = DEFAULT_SIZE,
  name,
  imageUri,
}) => {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

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
    <View style={[styles.avatar, styles.placeholder, dimensions]}>
      {name ? (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials(name)}
        </Text>
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{'\u{1F464}'}</Text>
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

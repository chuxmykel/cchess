import { View, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar';
import { radius, spacing } from '../../theme';

interface HomeHeaderProps {
  avatarName?: string;
  avatarColor?: string;
  onAvatarPress: () => void;
  /** Shown beside the avatar, e.g. the notifications bell. */
  accessory?: React.ReactNode;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  avatarName,
  avatarColor,
  onAvatarPress,
  accessory,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Image
        source={require('../../../assets/icon.png')} // FIXME: Change to actual logo when ready.
        style={styles.logo}
      />
      <View style={styles.trailing}>
        {accessory}
        <Pressable onPress={onAvatarPress} testID="avatar-button">
          <Avatar name={avatarName} color={avatarColor} />
        </Pressable>
      </View>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
  },
});

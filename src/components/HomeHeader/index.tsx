import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppLogo from '../AppLogo';
import Avatar from '../Avatar';
import { spacing } from '../../theme';

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
      <AppLogo size={36} testID="home-logo" />
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
});

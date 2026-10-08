import { View, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar';

interface HomeHeaderProps {
  onAvatarPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onAvatarPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Image
        source={require('../../../assets/icon.png')} // FIXME: Change to actual logo when ready.
        style={styles.logo}
      />
      <Pressable onPress={onAvatarPress} testID="avatar-button">
        <Avatar />
      </Pressable>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
});

import { Pressable } from 'react-native';

import Icon from '../Icon';

interface HeaderBackButtonProps {
  onPress: () => void;
}

/** A plain chevron back button, as on the game screen's own header. */
const HeaderBackButton: React.FC<HeaderBackButtonProps> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel="Back"
    testID="header-back"
  >
    <Icon name="chevron-left" size={28} />
  </Pressable>
);

export default HeaderBackButton;

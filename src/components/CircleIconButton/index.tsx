import { Pressable, StyleSheet } from 'react-native';

import Icon, { IconName } from '../Icon';
import { ACCENT_COLOR } from '../../constants/colors';

interface CircleIconButtonProps {
  icon: IconName;
  /** Read out by screen readers in place of a visible label. */
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  testID?: string;
}

const SIZE = 34;

const CircleIconButton: React.FC<CircleIconButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'secondary',
  testID,
}) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Icon name={icon} size={20} color={isPrimary ? 'white' : '#555'} />
    </Pressable>
  );
};

export default CircleIconButton;

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: ACCENT_COLOR,
  },
  secondary: {
    backgroundColor: '#ddd',
  },
  pressed: {
    opacity: 0.6,
  },
});

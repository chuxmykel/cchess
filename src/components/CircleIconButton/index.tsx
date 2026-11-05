import { Pressable } from 'react-native';

import Icon, { IconName } from '../Icon';
import { makeStyles, useTheme } from '../../theme';

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
  const styles = useStyles();
  const { colors } = useTheme();

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
      <Icon
        name={icon}
        size={20}
        color={isPrimary ? colors.textOnAccent : colors.textSecondary}
      />
    </Pressable>
  );
};

export default CircleIconButton;

const useStyles = makeStyles((t) => ({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: t.colors.accent,
  },
  secondary: {
    backgroundColor: t.colors.surfaceStrong,
  },
  pressed: {
    opacity: 0.6,
  },
}));

import { Text, Pressable, StyleProp, ViewStyle } from 'react-native';

import Icon, { IconName } from '../Icon';
import { makeStyles, ThemeColors, useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'outline' | 'text';

// A variant's label and icon color: white on the accent, else the accent.
function variantColor(colors: ThemeColors, variant: ButtonVariant): string {
  return variant === 'primary' ? colors.textOnAccent : colors.accent;
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  // Actually disables the button (blocks all presses) - standard Pressable behavior.
  disabled?: boolean;
  // Purely visual - looks disabled but is still pressable. Pressing calls
  // onDisabledPress instead of onPress.
  appearsDisabled?: boolean;
  onDisabledPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress = () => {},
  variant = 'primary',
  icon,
  disabled = false,
  appearsDisabled = false,
  onDisabledPress,
  style,
  testID,
}) => {
  const variantStyles = useVariantStyles();
  const variantLabelStyles = useVariantLabelStyles();
  const styles = useStyles();
  const { colors } = useTheme();

  function handlePress() {
    if (appearsDisabled) {
      onDisabledPress?.();
      return;
    }
    onPress();
  }

  return (
    <Pressable
      style={[
        styles.base,
        variantStyles[variant],
        appearsDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
    >
      {icon && (
        <Icon
          name={icon}
          size={20}
          color={
            appearsDisabled ? colors.textFaint : variantColor(colors, variant)
          }
          style={styles.icon}
          testID={testID && `${testID}-icon`}
        />
      )}
      <Text
        style={[
          styles.label,
          variantLabelStyles[variant],
          appearsDisabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default Button;

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
  },
  icon: {
    marginRight: t.spacing.sm,
  },
  label: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
  },
  disabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  disabledLabel: {
    color: t.colors.textFaint,
  },
}));

const useVariantStyles = makeStyles((t) => ({
  primary: {
    backgroundColor: t.colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: t.colors.accent,
  },
  text: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
}));

const useVariantLabelStyles = makeStyles((t) => ({
  primary: {
    color: variantColor(t.colors, 'primary'),
  },
  outline: {
    color: variantColor(t.colors, 'outline'),
  },
  text: {
    color: variantColor(t.colors, 'text'),
  },
}));

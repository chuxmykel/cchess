import {
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

import Icon, { IconName } from '../Icon';
import { ACCENT_COLOR } from '../../constants/colors';

type ButtonVariant = 'primary' | 'outline' | 'text';

const DISABLED_COLOR = '#aaa';
const VARIANT_COLORS: Record<ButtonVariant, string> = {
  primary: 'white',
  outline: ACCENT_COLOR,
  text: ACCENT_COLOR,
};

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
          color={appearsDisabled ? DISABLED_COLOR : VARIANT_COLORS[variant]}
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

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  disabledLabel: {
    color: DISABLED_COLOR,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: ACCENT_COLOR,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  text: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

const variantLabelStyles = StyleSheet.create({
  primary: {
    color: VARIANT_COLORS.primary,
  },
  outline: {
    color: VARIANT_COLORS.outline,
  },
  text: {
    color: VARIANT_COLORS.text,
  },
});

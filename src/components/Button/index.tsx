import {
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'text';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: string;
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
      {icon ? (
        <Text style={[styles.icon, appearsDisabled && styles.disabledIcon]}>
          {icon}
        </Text>
      ) : null}
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
    fontSize: 16,
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
  disabledIcon: {
    opacity: 0.4,
  },
  disabledLabel: {
    color: '#aaa',
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: '#769656',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#769656',
  },
  text: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

const variantLabelStyles = StyleSheet.create({
  primary: {
    color: 'white',
  },
  outline: {
    color: '#769656',
  },
  text: {
    color: '#769656',
  },
});

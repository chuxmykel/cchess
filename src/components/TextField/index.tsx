import { View, Text, TextInput, TextInputProps } from 'react-native';
import { makeStyles, useTheme } from '../../theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  trailing?: React.ReactNode;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  trailing,
  ...inputProps
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          placeholderTextColor={colors.textFaint}
          {...inputProps}
        />
        {trailing}
      </View>
    </View>
  );
};

export default TextField;

const useStyles = makeStyles((t) => ({
  field: {
    gap: t.spacing.sm,
  },
  label: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.md,
    backgroundColor: t.colors.background,
  },
  input: {
    color: t.colors.text,
    flex: 1,
    paddingVertical: t.spacing.md,
    fontSize: t.fontSize.xl,
  },
}));

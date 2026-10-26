import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
} from 'react-native';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
}

const TextField: React.FC<TextFieldProps> = ({ label, ...inputProps }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel={label}
      placeholderTextColor="#aaa"
      {...inputProps}
    />
  </View>
);

export default TextField;

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
});

import { useState } from 'react';
import { Pressable, TextInputProps } from 'react-native';

import Icon from '../Icon';
import TextField from '../TextField';

interface PasswordFieldProps extends Omit<
  TextInputProps,
  'style' | 'secureTextEntry'
> {
  label: string;
  testID: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  testID,
  ...fieldProps
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <TextField
      {...fieldProps}
      secureTextEntry={!isRevealed}
      testID={testID}
      trailing={
        <Pressable
          onPress={() => setIsRevealed((revealed) => !revealed)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
          testID={`${testID}-visibility-toggle`}
        >
          <Icon
            name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#888"
            testID={`${testID}-visibility-icon`}
          />
        </Pressable>
      }
    />
  );
};

export default PasswordField;

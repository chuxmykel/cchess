import { StyleProp, TextStyle } from 'react-native';
import {
  MaterialDesignIcons,
  type MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons';

import { useTheme } from '../../theme';

export type IconName = MaterialDesignIconsIconName;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const DEFAULT_SIZE = 20;

const Icon: React.FC<IconProps> = ({
  name,
  size = DEFAULT_SIZE,
  color,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  return (
    <MaterialDesignIcons
      name={name}
      size={size}
      color={color ?? colors.text}
      style={style}
      testID={testID}
      accessible={false}
    />
  );
};

export default Icon;

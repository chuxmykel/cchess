import { StyleProp, TextStyle } from 'react-native';
import {
  MaterialDesignIcons,
  type MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons';

export type IconName = MaterialDesignIconsIconName;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const DEFAULT_SIZE = 20;
const DEFAULT_COLOR = '#333';

const Icon: React.FC<IconProps> = ({
  name,
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
  testID,
}) => (
  <MaterialDesignIcons
    name={name}
    size={size}
    color={color}
    style={style}
    testID={testID}
    accessible={false}
  />
);

export default Icon;

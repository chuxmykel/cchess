import { ComponentProps } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

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
  <MaterialCommunityIcons
    name={name}
    size={size}
    color={color}
    style={style}
    testID={testID}
    accessible={false}
  />
);

export default Icon;

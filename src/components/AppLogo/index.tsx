import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '../../theme';

interface AppLogoProps {
  size: number;
  /** A logo's colors other than the theme in use's - Appearance's
   * choices, each drawn in its own. */
  colors?: { tile: string; squares: string };
  testID?: string;
}

// The cchess mark - a board's corner, two squares on a rounded tile - in
// the color theme's colors.
const AppLogo: React.FC<AppLogoProps> = ({ size, colors, testID }) => {
  const theme = useTheme();
  const { tile, squares } = colors ?? theme.colors.logo;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      testID={testID}
      accessibilityLabel="cchess"
    >
      <Rect width={24} height={24} rx={6} fill={tile} />
      <Rect x={4} y={4} width={8} height={8} fill={squares} />
      <Rect x={12} y={12} width={8} height={8} fill={squares} />
    </Svg>
  );
};

export default AppLogo;

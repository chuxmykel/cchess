import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Menu from '../Menu';
import PasteGame from '../PasteGame';
import PickGame from '../PickGame';
import {
  plainHeaderOptions,
  tabRootHeaderOptions,
} from '../plainHeaderOptions';
import { MenuStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<MenuStackParamList>();

// The Menu tab, and the screens an analysis starts from there. The board
// itself is HomeStack's AnalysisBoard, over the tabs, as are your profile
// and the settings.
const MenuStack: React.FC = () => (
  <Navigator
    id="MenuStack"
    initialRouteName="Menu"
    screenOptions={({ navigation }) => plainHeaderOptions(navigation)}
  >
    <Screen
      name="Menu"
      component={Menu}
      options={{ ...tabRootHeaderOptions, title: 'Menu' }}
    />
    <Screen
      name="PasteGame"
      component={PasteGame}
      options={{ title: 'Paste PGN or FEN' }}
    />
    <Screen
      name="PickGame"
      component={PickGame}
      options={{ title: 'Your games' }}
    />
  </Navigator>
);

export default MenuStack;

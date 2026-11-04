import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnalysisHome from '../AnalysisHome';
import PasteGame from '../PasteGame';
import PickGame from '../PickGame';
import { plainHeaderOptions } from '../plainHeaderOptions';
import { AnalysisStackParamList } from './types';

const { Navigator, Screen } =
  createNativeStackNavigator<AnalysisStackParamList>();

// The Analysis tab: where to start an analysis. The board itself is
// HomeStack's AnalysisBoard, over the tabs.
const AnalysisStack: React.FC = () => (
  <Navigator
    id="AnalysisStack"
    initialRouteName="AnalysisHome"
    screenOptions={({ navigation }) => plainHeaderOptions(navigation)}
  >
    <Screen
      name="AnalysisHome"
      component={AnalysisHome}
      options={{ title: 'Analysis' }}
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

export default AnalysisStack;

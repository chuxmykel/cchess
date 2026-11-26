import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Puzzles from '../Puzzles';
import {
  plainHeaderOptions,
  tabRootHeaderOptions,
} from '../plainHeaderOptions';
import type { PuzzlesStackParamList } from './types';

const { Navigator, Screen } =
  createNativeStackNavigator<PuzzlesStackParamList>();

// The Puzzles tab: its home. A run of puzzles opens over the tabs.
const PuzzlesStack: React.FC = () => (
  <Navigator
    id="PuzzlesStack"
    screenOptions={({ navigation }) => plainHeaderOptions(navigation)}
  >
    <Screen
      name="Puzzles"
      component={Puzzles}
      options={{ ...tabRootHeaderOptions, title: 'Puzzles' }}
    />
  </Navigator>
);

export default PuzzlesStack;

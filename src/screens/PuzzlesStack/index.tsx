import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Puzzles from '../Puzzles';
import {
  plainHeaderOptions,
  tabRootHeaderOptions,
} from '../plainHeaderOptions';

const { Navigator, Screen } = createNativeStackNavigator<{
  Puzzles: undefined;
}>();

// The Puzzles tab - for now, what's coming.
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

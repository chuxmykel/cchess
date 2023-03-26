import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import Home from './src/screens/Home';

const {
  Navigator,
  Screen
} = createDrawerNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Navigator
          initialRouteName='Home'
        // screenOptions={{
        // headerShown: false,
        // }}
        >
          <Screen name="Home" component={Home} />
        </Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </>
  );
}


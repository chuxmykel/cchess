import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeStack from "./src/screens/HomeStack";

const { Navigator, Screen } = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Navigator
          id="RootNavigator"
          initialRouteName="HomeStack"
          // screenOptions={{
          // headerShown: false,
          // }}
        >
          <Screen name="HomeStack" component={HomeStack} />
        </Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </>
  );
}


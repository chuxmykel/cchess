import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import HomeStack from './src/screens/HomeStack';
import { AuthSessionProvider } from './src/context/AuthSessionContext';
import { EngineProvider } from './src/context/EngineContext';

const { Navigator, Screen } = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthSessionProvider>
          <EngineProvider>
            <NavigationContainer>
              <Navigator
                id="RootNavigator"
                initialRouteName="HomeStack"
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Screen name="HomeStack" component={HomeStack} />
              </Navigator>
              <StatusBar style="auto" />
            </NavigationContainer>
          </EngineProvider>
        </AuthSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

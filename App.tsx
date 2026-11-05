import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import HomeStack from './src/screens/HomeStack';
import { AuthSessionProvider } from './src/context/AuthSessionContext';
import { EngineProvider } from './src/context/EngineContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationTheme, useTheme } from './src/theme';

const { Navigator, Screen } = createNativeStackNavigator();

// Navigation, in the theme's colors: its headers and tab bar, and the status
// bar's text dark on light or light on dark.
function ThemedNavigation() {
  const theme = useTheme();
  const navTheme = useMemo(() => navigationTheme(theme), [theme]);
  return (
    <NavigationContainer theme={navTheme}>
      <Navigator
        id="RootNavigator"
        initialRouteName="HomeStack"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="HomeStack" component={HomeStack} />
      </Navigator>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthSessionProvider>
            <EngineProvider>
              <ThemedNavigation />
            </EngineProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

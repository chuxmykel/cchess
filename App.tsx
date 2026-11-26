import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { analytics } from './src/analytics/analytics';
import UpdateRequired from './src/components/UpdateRequired';
import { useAnalyticsIdentity } from './src/hooks/useAnalyticsIdentity';
import { applySavedAnalyticsConsent } from './src/hooks/useAnalyticsConsent';
import { useUpdateRequired } from './src/hooks/useUpdateRequired';
import HomeStack from './src/screens/HomeStack';
import { RootStackParamList } from './src/screens/HomeStack/types';
import { linking } from './src/screens/linking';
import { AuthSessionProvider } from './src/context/AuthSessionContext';
import { EngineProvider } from './src/context/EngineContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationTheme, useTheme } from './src/theme';

const { Navigator, Screen } = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Each screen shown, by its route's name, for analytics.
function reportScreen() {
  const route = navigationRef.getCurrentRoute();
  if (route) analytics.screen(route.name);
}

// Navigation, in the theme's colors: its headers and tab bar, and the status
// bar's text dark on light or light on dark.
function ThemedNavigation() {
  const theme = useTheme();
  const navTheme = useMemo(() => navigationTheme(theme), [theme]);
  const isUpdateRequired = useUpdateRequired();
  useAnalyticsIdentity();
  if (isUpdateRequired) {
    return <UpdateRequired />;
  }
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
      onReady={reportScreen}
      onStateChange={reportScreen}
    >
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
  useEffect(() => {
    void applySavedAnalyticsConsent();
  }, []);
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

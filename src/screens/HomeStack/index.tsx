import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { SocialProvider } from '../../context/SocialContext';
import HomeTabs from '../HomeTabs';
import LiveGame from '../LiveGame';
import GameViewer from '../GameViewer';
import SignIn from '../SignIn';
import CreateAccount from '../CreateAccount';
import { HomeStackParamList, RootStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

const ACCOUNT_SCREEN_OPTIONS = {
  headerShown: true,
  headerBackButtonDisplayMode: 'minimal',
} as const;

const HomeStack: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const openGame = useCallback(
    (gameId: string) =>
      navigation.navigate('HomeStack', {
        screen: 'LiveGame',
        params: { gameId },
      }),
    [navigation],
  );

  return (
    <SocialProvider onGameStarted={openGame}>
      <Navigator
        id="HomeStack"
        initialRouteName="HomeTabs"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="HomeTabs" component={HomeTabs} />
        <Screen
          name="LiveGame"
          component={LiveGame}
          options={{ gestureEnabled: false }}
        />
        <Screen name="GameViewer" component={GameViewer} />
        <Screen
          name="SignIn"
          component={SignIn}
          options={{ ...ACCOUNT_SCREEN_OPTIONS, title: 'Sign in' }}
        />
        <Screen
          name="CreateAccount"
          component={CreateAccount}
          options={{ ...ACCOUNT_SCREEN_OPTIONS, title: 'Create account' }}
        />
      </Navigator>
    </SocialProvider>
  );
};

export default HomeStack;

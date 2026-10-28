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
import UserProfile from '../UserProfile';
import Conversation from '../Conversation';
import GamesList from '../GamesList';
import SignIn from '../SignIn';
import CreateAccount from '../CreateAccount';
import { HomeStackParamList, RootStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

const WITH_HEADER = {
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
          name="UserProfile"
          component={UserProfile}
          options={({ route }) => ({
            ...WITH_HEADER,
            title: route.params.username,
          })}
        />
        <Screen
          name="Conversation"
          component={Conversation}
          options={WITH_HEADER}
        />
        <Screen name="GamesList" component={GamesList} options={WITH_HEADER} />
        <Screen
          name="SignIn"
          component={SignIn}
          options={{ ...WITH_HEADER, title: 'Sign in' }}
        />
        <Screen
          name="CreateAccount"
          component={CreateAccount}
          options={{ ...WITH_HEADER, title: 'Create account' }}
        />
      </Navigator>
    </SocialProvider>
  );
};

export default HomeStack;

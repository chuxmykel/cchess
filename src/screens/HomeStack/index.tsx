import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { SocialProvider } from '../../context/SocialContext';
import { useResumeActiveGame } from '../../hooks/useResumeActiveGame';
import HomeTabs from '../HomeTabs';
import LiveGame from '../LiveGame';
import GameViewer from '../GameViewer';
import UserProfile from '../UserProfile';
import Conversation from '../Conversation';
import GamesList from '../GamesList';
import UserFriends from '../UserFriends';
import RatingStats from '../RatingStats';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import SignIn from '../SignIn';
import CreateAccount from '../CreateAccount';
import { plainHeaderOptions } from '../plainHeaderOptions';
import { HomeStackParamList, RootStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

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
  useResumeActiveGame(openGame);

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
          // The profile shows the username in its title itself, once the
          // avatar block scrolls away.
          options={({ navigation }) => ({
            ...plainHeaderOptions(navigation),
            title: '',
          })}
        />
        <Screen
          name="Conversation"
          component={Conversation}
          options={({ navigation }) => plainHeaderOptions(navigation)}
        />
        <Screen
          name="UserFriends"
          component={UserFriends}
          options={({ navigation }) => plainHeaderOptions(navigation)}
        />
        <Screen
          name="GamesList"
          component={GamesList}
          options={({ navigation }) => plainHeaderOptions(navigation)}
        />
        <Screen
          name="RatingStats"
          component={RatingStats}
          options={({ navigation, route }) => ({
            ...plainHeaderOptions(navigation),
            title: `${GAME_TYPE_LABELS[route.params.category]} rating`,
          })}
        />
        <Screen
          name="SignIn"
          component={SignIn}
          options={({ navigation }) => ({
            ...plainHeaderOptions(navigation),
            title: 'Sign in',
          })}
        />
        <Screen
          name="CreateAccount"
          component={CreateAccount}
          options={({ navigation }) => ({
            ...plainHeaderOptions(navigation),
            title: 'Create account',
          })}
        />
      </Navigator>
    </SocialProvider>
  );
};

export default HomeStack;

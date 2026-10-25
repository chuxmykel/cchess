import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeTabs from '../HomeTabs';
import LiveGame from '../LiveGame';
import Matchmaking from '../Matchmaking';
import { HomeStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  return (
    <>
      <Navigator
        id="HomeStack"
        initialRouteName="HomeTabs"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="HomeTabs" component={HomeTabs} />
        <Screen name="Matchmaking" component={Matchmaking} />
        <Screen
          name="LiveGame"
          component={LiveGame}
          options={{ gestureEnabled: false }}
        />
      </Navigator>
    </>
  );
};

export default HomeStack;

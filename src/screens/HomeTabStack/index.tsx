import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../Home';
import NewGame from '../NewGame';
import Friends from '../Friends';
import { HomeTabStackParamList } from './types';

const { Navigator, Screen } =
  createNativeStackNavigator<HomeTabStackParamList>();

const WITH_HEADER = {
  headerShown: true,
  headerBackButtonDisplayMode: 'minimal',
} as const;

const HomeTabStack: React.FC = () => {
  return (
    <>
      <Navigator
        id="HomeTabStack"
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="Home" component={Home} />
        <Screen name="NewGame" component={NewGame} />
        <Screen
          name="Friends"
          component={Friends}
          options={{ ...WITH_HEADER, title: 'Friends' }}
        />
      </Navigator>
    </>
  );
};

export default HomeTabStack;

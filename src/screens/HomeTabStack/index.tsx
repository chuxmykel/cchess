import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../Home';
import NewGame from '../NewGame';
import Friends from '../Friends';
import { plainHeaderOptions } from '../plainHeaderOptions';
import { HomeTabStackParamList } from './types';

const { Navigator, Screen } =
  createNativeStackNavigator<HomeTabStackParamList>();

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
          options={({ navigation }) => ({
            ...plainHeaderOptions(navigation),
            title: 'Friends',
          })}
        />
      </Navigator>
    </>
  );
};

export default HomeTabStack;

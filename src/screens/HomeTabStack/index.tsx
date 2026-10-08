import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../Home';
import NewGame from '../NewGame';

const { Navigator, Screen } = createNativeStackNavigator();

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
      </Navigator>
    </>
  );
};

export default HomeTabStack;

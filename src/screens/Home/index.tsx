import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewGameScreen from './screens/NewGameScreen';
import Game from '../Game';

const { Navigator, Screen } = createNativeStackNavigator();

const Home: React.FC = () => {
  return (
    <>
      <Navigator
        initialRouteName='Game'
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="NewGame" component={NewGameScreen} />
        <Screen name="Game" component={Game} />
      </Navigator>
    </>
  );
}

export default Home;


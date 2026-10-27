import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeTabs from '../HomeTabs';
import LiveGame from '../LiveGame';
import SignIn from '../SignIn';
import CreateAccount from '../CreateAccount';
import { HomeStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

const ACCOUNT_SCREEN_OPTIONS = {
  headerShown: true,
  headerBackButtonDisplayMode: 'minimal',
} as const;

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
        <Screen
          name="LiveGame"
          component={LiveGame}
          options={{ gestureEnabled: false }}
        />
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
    </>
  );
};

export default HomeStack;

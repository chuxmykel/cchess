import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeTabs from "../HomeTabs";
import Game from "../Game";

const { Navigator, Screen } = createNativeStackNavigator();

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
        <Screen name="Game" component={Game} />
      </Navigator>
    </>
  );
};

export default HomeStack;

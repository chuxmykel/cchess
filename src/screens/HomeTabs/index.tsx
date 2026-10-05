import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Home from "../Home";
import Profile from "../Profile";
import NewGame from "../NewGame";

const { Navigator, Screen } = createBottomTabNavigator();

const HomeTabs: React.FC = () => {
  return (
    <>
      <Navigator
        id="HomeTabs"
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Screen name="Home" component={Home} />
        <Screen name="Profile" component={Profile} />
        <Screen
          name="NewGame"
          component={NewGame}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Navigator>
    </>
  );
}

export default HomeTabs;

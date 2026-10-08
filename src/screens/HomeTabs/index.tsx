import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeTabStack from '../HomeTabStack';
import Profile from '../Profile';

const { Navigator, Screen } = createBottomTabNavigator();

const HomeTabs: React.FC = () => {
  return (
    <>
      <Navigator
        id="HomeTabs"
        initialRouteName="HomeTabStack"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        <Screen
          name="HomeTabStack"
          component={HomeTabStack}
          options={{ tabBarLabel: 'Home' }}
        />
        <Screen name="Profile" component={Profile} />
      </Navigator>
    </>
  );
};

export default HomeTabs;

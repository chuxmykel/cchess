import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from '../../components/Icon';
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
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <Icon
                name={focused ? 'home-variant' : 'home-variant-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Icon
                name={focused ? 'account' : 'account-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Navigator>
    </>
  );
};

export default HomeTabs;

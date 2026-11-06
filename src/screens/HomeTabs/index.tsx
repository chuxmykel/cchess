import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from '../../components/Icon';
import AnalysisStack from '../AnalysisStack';
import HomeTabStack from '../HomeTabStack';
import Profile from '../Profile';
import { useTheme } from '../../theme';

const { Navigator, Screen } = createBottomTabNavigator();

const HomeTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <>
      <Navigator
        id="HomeTabs"
        initialRouteName="HomeTabStack"
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
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
          name="AnalysisStack"
          component={AnalysisStack}
          options={{
            tabBarLabel: 'Analysis',
            tabBarIcon: ({ color, size }) => (
              <Icon name="head-cog-outline" size={size} color={color} />
            ),
            tabBarButtonTestID: 'analysis-tab',
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

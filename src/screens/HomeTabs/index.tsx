import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from '../../components/Icon';
import { useSocialContext } from '../../context/SocialContext';
import HomeTabStack from '../HomeTabStack';
import MenuStack from '../MenuStack';
import MessagesStack from '../MessagesStack';
import PuzzlesStack from '../PuzzlesStack';
import { HomeTabsParamList } from './types';
import { useTheme } from '../../theme';

const { Navigator, Screen } = createBottomTabNavigator<HomeTabsParamList>();

/** The most a tab's badge counts before it reads "99+". */
const MAX_BADGE_COUNT = 99;

/** The Messages tab's badge: every unread message, from anyone - none at
 * all with nothing unread. */
export function unreadBadge(
  unreadByUserId: Record<string, number>,
): number | string | undefined {
  const unread = Object.values(unreadByUserId).reduce(
    (total, count) => total + count,
    0,
  );
  if (unread === 0) return undefined;
  return unread > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unread;
}

const HomeTabs: React.FC = () => {
  const { colors } = useTheme();
  const { unreadByUserId } = useSocialContext();

  return (
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
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Screen
        name="PuzzlesStack"
        component={PuzzlesStack}
        options={{
          tabBarLabel: 'Puzzles',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'puzzle' : 'puzzle-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarButtonTestID: 'puzzles-tab',
        }}
      />
      <Screen
        name="MessagesStack"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'message-text' : 'message-text-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: unreadBadge(unreadByUserId),
          tabBarBadgeStyle: { backgroundColor: colors.danger },
          tabBarButtonTestID: 'messages-tab',
        }}
      />
      <Screen
        name="MenuStack"
        component={MenuStack}
        options={{
          // "More" on the tab bar; the screen itself is headed "Menu".
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          ),
          tabBarButtonTestID: 'menu-tab',
        }}
      />
    </Navigator>
  );
};

export default HomeTabs;

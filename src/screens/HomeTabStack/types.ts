import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../HomeStack/types';
import { HomeTabsParamList } from '../HomeTabs/types';

export type HomeTabStackParamList = {
  Home: undefined;
  NewGame: undefined;
  /** focusSearch opens it ready to type in the player search. */
  Friends: { focusSearch?: boolean } | undefined;
};

/** A tab-stack screen's props, able to switch tabs and open the screens
 * shown over them. */
export type HomeTabStackScreenProps<
  RouteName extends keyof HomeTabStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<HomeTabStackParamList, RouteName>,
  CompositeScreenProps<
    BottomTabScreenProps<HomeTabsParamList>,
    NativeStackScreenProps<HomeStackParamList>
  >
>;

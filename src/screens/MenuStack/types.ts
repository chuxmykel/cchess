import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../HomeStack/types';
import { HomeTabsParamList } from '../HomeTabs/types';

export type MenuStackParamList = {
  Menu: undefined;
  /** One of your games, to analyse. */
  PickGame: undefined;
  PasteGame: undefined;
};

/** A Menu-tab screen's props, able to switch tabs and open the screens
 * shown over them. */
export type MenuStackScreenProps<RouteName extends keyof MenuStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MenuStackParamList, RouteName>,
    CompositeScreenProps<
      BottomTabScreenProps<HomeTabsParamList>,
      NativeStackScreenProps<HomeStackParamList>
    >
  >;

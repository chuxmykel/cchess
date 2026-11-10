import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../HomeStack/types';
import { HomeTabsParamList } from '../HomeTabs/types';

export type MessagesStackParamList = {
  Messages: undefined;
};

/** A Messages-tab screen's props, able to switch tabs and open the screens
 * shown over them - a conversation among them. */
export type MessagesStackScreenProps<
  RouteName extends keyof MessagesStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<MessagesStackParamList, RouteName>,
  CompositeScreenProps<
    BottomTabScreenProps<HomeTabsParamList>,
    NativeStackScreenProps<HomeStackParamList>
  >
>;

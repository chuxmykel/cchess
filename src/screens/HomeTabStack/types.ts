import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../HomeStack/types';
import { HomeTabsParamList } from '../HomeTabs/types';

export type ConversationPartner = {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type HomeTabStackParamList = {
  Home: undefined;
  NewGame: undefined;
  Friends: undefined;
  UserProfile: { username: string };
  Conversation: ConversationPartner;
  /** Someone's games; your own without a username. */
  GamesList: { username?: string; displayName?: string };
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

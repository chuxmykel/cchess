import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Seek } from '../../constants/seek';
import { GameType } from '../../domain/types';

export type ConversationPartner = {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type HomeStackParamList = {
  HomeTabs: undefined;
  LiveGame: { seek: Seek } | { gameId: string };
  /** watchedUserId: the player whose game this is being watched for -
   * shown at the bottom, and followed into their next game. */
  GameViewer: { gameId: string; watchedUserId?: string };
  UserProfile: { username: string };
  Conversation: ConversationPartner;
  /** Friends over the tabs, for screens there to open; focusSearch opens
   * it ready to type in the player search. */
  FindFriends: { focusSearch?: boolean } | undefined;
  /** Everyone a player is friends with. */
  UserFriends: { username: string; displayName: string };
  /** Someone's games; your own without a username. */
  GamesList: { username?: string; displayName?: string };
  /** A player's rating history and results in one category. */
  RatingStats: { username: string; displayName: string; category: GameType };
  SignIn: undefined;
  CreateAccount: undefined;
};

export type RootStackParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
};

export type HomeStackScreenProps<RouteName extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, RouteName>;

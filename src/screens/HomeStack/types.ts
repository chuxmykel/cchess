import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Color } from 'chess.js';

import { Seek } from '../../constants/seek';
import { GameType } from '../../domain/types';
import { AnalysisSource } from '../../hooks/useAnalysisSource';
import { ExplorerLine } from '../../hooks/useExplorerLine';

export type ConversationPartner = {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type HomeStackParamList = {
  HomeTabs: undefined;
  LiveGame: { seek: Seek } | { gameId: string };
  /** One of your daily games, to play a move in whenever you like. */
  DailyGame: { gameId: string };
  /** A daily game in an analysis board of its own - no engine - apart
   * from the game. */
  DailyAnalysis: { gameId: string; explorerLine?: ExplorerLine };
  /** The opening explorer, on a board of its own, from an analysis's
   * position - `returnKey` the analysis's route, which gets the line
   * explored back on leaving. */
  OpeningExplorer: ExplorerLine & { orientation: Color; returnKey: string };
  /** Your conditional moves in a daily game, the opponent to move. */
  ConditionalMoves: { gameId: string };
  /** Your own notes on a game. */
  GameNotes: { gameId: string };
  /** watchedUserId: the player whose game this is being watched for -
   * shown at the bottom, and followed into their next game. */
  GameViewer: { gameId: string; watchedUserId?: string };
  /** The analysis board, over the tabs - opened from the Analysis tab, or
   * from a game, so Back returns there. */
  AnalysisBoard: { source: AnalysisSource; explorerLine?: ExplorerLine };
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
  /** The analysis board's settings, over it. */
  AnalysisSettings: undefined;
  /** Daily games' settings, over one. */
  DailyGameSettings: undefined;
  /** Credit and licences for what the app uses, the engine's above all. */
  Licenses: undefined;
  Appearance: undefined;
};

export type RootStackParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
};

export type HomeStackScreenProps<RouteName extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, RouteName>;

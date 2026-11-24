import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Color } from 'chess.js';

import { Seek } from '../../constants/seek';
import type { HomeTabsParamList } from '../HomeTabs/types';
import { GameType } from '../../domain/types';
import { AnalysisSource } from '../../hooks/useAnalysisSource';
import { ExplorerLine } from '../../hooks/useExplorerLine';
import type { ImportedReview } from '../../hooks/useGameReview';

export type ConversationPartner = {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type ReportTarget = {
  username: string;
  displayName: string;
  gameId?: string;
  messageId?: string;
  /** The message's words, to show what's being reported. */
  messageText?: string;
};

export type HomeStackParamList = {
  /** The tabs - a tab named to open it there. */
  HomeTabs: NavigatorScreenParams<HomeTabsParamList> | undefined;
  LiveGame: { seek: Seek } | { gameId: string };
  /** One of your daily games, to play a move in whenever you like. */
  DailyGame: { gameId: string };
  /** A daily game in an analysis board of its own - no engine - apart
   * from the game. */
  DailyAnalysis: { gameId: string; explorerLine?: ExplorerLine };
  /** The opening explorer, on a board of its own, from an analysis's
   * position - `returnKey` the analysis's route, which gets the line
   * explored back on leaving - or from the Menu, on its own. */
  OpeningExplorer: ExplorerLine & { orientation: Color; returnKey?: string };
  /** Your conditional moves in a daily game, the opponent to move. */
  ConditionalMoves: { gameId: string };
  /** Your own notes on a game. */
  GameNotes: { gameId: string };
  /** A finished game's review: its key moments, stepped through - a game
   * played here, or one brought in (a PGN pasted). */
  GameReview: { gameId: string } | { imported: ImportedReview };
  /** watchedUserId: the player whose game this is being watched for -
   * shown at the bottom, and followed into their next game. */
  GameViewer: { gameId: string; watchedUserId?: string };
  /** The analysis board, over the tabs - opened from the Menu tab, or
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
  /** Every daily game of yours in progress, and seeks still waiting. */
  DailyGamesList: undefined;
  /** A player's rating history and results in one category. */
  RatingStats: { username: string; displayName: string; category: GameType };
  SignIn: undefined;
  CreateAccount: undefined;
  /** Every setting, from the Menu tab. */
  Settings: undefined;
  /** The analysis board's settings, over it. */
  AnalysisSettings: undefined;
  /** Daily games' settings, over one. */
  DailyGameSettings: undefined;
  /** The game review's settings, over one or from Settings. */
  ReviewSettings: undefined;
  /** Your account, from Settings: email, chat, blocked players, deleting
   * it. Signed in only. */
  Account: undefined;
  /** Deleting your account, its password confirming it. */
  DeleteAccount: undefined;
  /** Asking for a password reset link, from Sign in. */
  ForgotPassword: undefined;
  /** Opened by a reset link from an email (<server>/app/reset-password). */
  ResetPassword: { token: string };
  /** Opened by a verify link from an email (<server>/app/verify-email). */
  VerifyEmail: { token: string };
  /** A new email, confirmed by a link sent there. */
  ChangeEmail: undefined;
  /** The players you've blocked, to unblock. */
  BlockedPlayers: undefined;
  /** Reporting a player - for something they said (a chat message of
   * gameId's, or a direct message), or just them. */
  Report: ReportTarget;
  /** Credit and licences for what the app uses, the engine's above all. */
  Licenses: undefined;
  Appearance: undefined;
};

export type RootStackParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
};

export type HomeStackScreenProps<RouteName extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, RouteName>;

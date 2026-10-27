import { NavigatorScreenParams } from '@react-navigation/native';

import { Seek } from '../../constants/seek';

export type HomeStackParamList = {
  HomeTabs: undefined;
  LiveGame: { seek: Seek } | { gameId: string };
  GameViewer: { gameId: string };
  SignIn: undefined;
  CreateAccount: undefined;
};

export type RootStackParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
};

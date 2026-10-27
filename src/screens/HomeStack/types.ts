import { Seek } from '../../constants/seek';

export type HomeStackParamList = {
  HomeTabs: undefined;
  LiveGame: { seek: Seek } | { gameId: string };
  SignIn: undefined;
  CreateAccount: undefined;
};

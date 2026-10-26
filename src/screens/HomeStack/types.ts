import { TimeControl } from '../../constants/timeControls';

export type HomeStackParamList = {
  HomeTabs: undefined;
  LiveGame: { timeControl: TimeControl } | { gameId: string };
};

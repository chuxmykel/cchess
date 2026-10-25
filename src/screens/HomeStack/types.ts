import { TimeControl } from '../../constants/timeControls';

export type HomeStackParamList = {
  HomeTabs: undefined;
  Matchmaking: { timeControl: TimeControl };
  // Just the id - LiveGame re-fetches the authoritative GameSnapshot itself
  // via game:join/game:state on mount rather than trusting whatever
  // Matchmaking last saw, so it also works if LiveGame is ever reached
  // another way later (e.g. resuming an in-progress game from a games list).
  LiveGame: { gameId: string };
};

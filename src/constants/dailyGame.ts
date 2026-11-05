// Daily games' settings, kept on the device.
export type DailyGameSettings = {
  /** Each move waits for a confirming tap before it's sent - a daily
   * game's move is days of thought, and a slip can't be taken back. */
  confirmMoves: boolean;
};

export const DEFAULT_DAILY_GAME_SETTINGS: DailyGameSettings = {
  confirmMoves: false,
};

import { ColorChoice, RatingRange } from '../network/socketEvents';
import { TimeControl } from './timeControls';

export type Seek = {
  timeControl: TimeControl;
  rated: boolean;
  ratingRange: RatingRange;
  /** The color to play; random when left out. */
  color?: ColorChoice;
};

/** What a daily seek left waiting - not matched at once - says. */
export const DAILY_SEEK_QUEUED_MESSAGE =
  'Looking for an opponent. The game will appear in Your games.';

export const RATING_RANGE_STEP = 50;
export const MAX_RATING_RANGE_DELTA = 500;
export const DEFAULT_RATING_RANGE: RatingRange = {
  below: MAX_RATING_RANGE_DELTA,
  above: MAX_RATING_RANGE_DELTA,
};

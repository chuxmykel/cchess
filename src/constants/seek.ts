import { RatingRange } from '../network/socketEvents';
import { TimeControl } from './timeControls';

export type Seek = {
  timeControl: TimeControl;
  rated: boolean;
  ratingRange: RatingRange;
};

export const RATING_RANGE_STEP = 50;
export const MAX_RATING_RANGE_DELTA = 500;
export const DEFAULT_RATING_RANGE: RatingRange = {
  below: MAX_RATING_RANGE_DELTA,
  above: MAX_RATING_RANGE_DELTA,
};

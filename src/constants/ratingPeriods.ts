import { RatingPeriod } from '../network/restClient';

export const RATING_PERIOD_LABELS: Record<RatingPeriod, string> = {
  '1w': '1W',
  '1m': '1M',
  '3m': '3M',
  '1y': '1Y',
  all: 'All',
};

/** How far back each period reaches, matching the server's. */
export const RATING_PERIOD_DAYS: Record<
  Exclude<RatingPeriod, 'all'>,
  number
> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '1y': 365,
};

export const DEFAULT_RATING_PERIOD: RatingPeriod = '1m';

import { RatingPoint } from '../network/restClient';

export type ChartDatum = {
  time: number;
  rating: number;
  /** The last rating carried through to the end of the period. */
  isHeld: boolean;
};

const MIN_RATING_SPAN = 20;
const TICK_ROUNDING = 10;

/**
 * What the rating chart plots over the time from `from` to `to`: each
 * rating, then the last one held through to `to` - since that's still the
 * rating then - and a rating range rounded out to whole tens, with three
 * evenly spaced ticks across it.
 */
export function ratingChartData(
  history: RatingPoint[],
  from: number,
  to: number,
): { data: ChartDatum[]; yDomain: [number, number]; yTicks: number[] } {
  const data = history.map((point) => ({
    time: Math.max(new Date(point.at).getTime(), from),
    rating: point.rating,
    isHeld: false,
  }));
  if (data.length > 0) {
    data.push({ time: to, rating: data[data.length - 1].rating, isHeld: true });
  }
  const ratings = data.map((point) => point.rating);
  let low = Math.floor(Math.min(...ratings) / TICK_ROUNDING) * TICK_ROUNDING;
  let high = Math.ceil(Math.max(...ratings) / TICK_ROUNDING) * TICK_ROUNDING;
  if (high - low < MIN_RATING_SPAN) {
    const middle = (low + high) / 2;
    low = middle - MIN_RATING_SPAN / 2;
    high = middle + MIN_RATING_SPAN / 2;
  }
  return {
    data,
    yDomain: [low, high],
    yTicks: [low, Math.round((low + high) / 2), high],
  };
}

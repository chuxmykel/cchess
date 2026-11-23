import { RatingPoint } from '../network/restClient';

export type ChartDatum = {
  time: number;
  rating: number;
  /** The last rating carried through to the end of the period. */
  isHeld: boolean;
};

/**
 * What the rating chart plots over the time from `from` to `to`: each
 * rating - kept within the period, since the history starts with the
 * rating going into its first game - with that first rating drawn back to
 * `from`, since it was the rating all the time before the game, then the
 * last one held through to `to`, since that's still the rating then. With
 * no games in the period, `currentRating` - given - is the rating the
 * whole way across. The chart works out the rating axis itself.
 */
export function ratingChartData(
  history: RatingPoint[],
  from: number,
  to: number,
  currentRating?: number,
): ChartDatum[] {
  const data = history.map((point) => ({
    time: Math.max(new Date(point.at).getTime(), from),
    rating: point.rating,
    isHeld: false,
  }));
  if (data.length === 0) {
    if (currentRating === undefined) return [];
    data.push({ time: from, rating: currentRating, isHeld: false });
  } else if (data[0].time > from) {
    data.unshift({ time: from, rating: data[0].rating, isHeld: false });
  }
  data.push({ time: to, rating: data[data.length - 1].rating, isHeld: true });
  return data;
}

/** The index of the point closest in time to `time`. */
export function nearestDatumIndex(data: ChartDatum[], time: number): number {
  let nearest = 0;
  data.forEach((datum, index) => {
    if (Math.abs(datum.time - time) < Math.abs(data[nearest].time - time)) {
      nearest = index;
    }
  });
  return nearest;
}

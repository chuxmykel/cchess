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
 * rating going into its first game - then the last one held through to
 * `to`, since that's still the rating then. The chart works out the rating
 * axis itself.
 */
export function ratingChartData(
  history: RatingPoint[],
  from: number,
  to: number,
): ChartDatum[] {
  const data = history.map((point) => ({
    time: Math.max(new Date(point.at).getTime(), from),
    rating: point.rating,
    isHeld: false,
  }));
  if (data.length > 0) {
    data.push({ time: to, rating: data[data.length - 1].rating, isHeld: true });
  }
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

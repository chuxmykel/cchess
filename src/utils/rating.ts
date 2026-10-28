import { formatDuration, intervalToDuration } from 'date-fns';

import { Score, UserRating } from '../network/restClient';
import { RatingRange } from '../network/socketEvents';

export function formatRating(rating: number, provisional: boolean): string {
  return provisional ? `${rating}?` : `${rating}`;
}

export function formatRatingRange(rating: number, range: RatingRange): string {
  if (range.below === null && range.above === null) {
    return 'Any rating';
  }
  if (range.below === null) {
    return `up to ${rating + range.above}`;
  }
  if (range.above === null) {
    return `${rating - range.below}+`;
  }
  return `${rating - range.below}–${rating + range.above}`;
}

/** Someone's highest rating, as their headline one. Categories they've
 * never played are left out: those hold only the starting rating. */
export function highestRating(ratings: UserRating[]): UserRating | null {
  return ratings
    .filter((rating) => rating.gamesPlayed > 0)
    .reduce<UserRating | null>(
      (highest, rating) =>
        !highest || rating.rating > highest.rating ? rating : highest,
      null,
    );
}

/** Points, a draw counting half: "2", "½", "2½". */
export function formatPoints(points: number): string {
  const whole = Math.floor(points);
  const hasHalf = points !== whole;
  if (!hasHalf) return `${whole}`;
  return whole === 0 ? '½' : `${whole}½`;
}

/** Points for and against, a draw counting half: "2½ - 3½". */
export function formatScore({ wins, draws, losses }: Score): string {
  return `${formatPoints(wins + draws / 2)} - ${formatPoints(losses + draws / 2)}`;
}

/** "3 hours, 5 minutes", or "0 minutes" for none. */
export function formatTimePlayed(ms: number): string {
  const duration = intervalToDuration({ start: 0, end: ms });
  const formatted = formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    delimiter: ', ',
  });
  return formatted || '0 minutes';
}

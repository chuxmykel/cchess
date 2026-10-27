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

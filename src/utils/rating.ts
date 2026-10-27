export function formatRating(rating: number, provisional: boolean): string {
  return provisional ? `${rating}?` : `${rating}`;
}

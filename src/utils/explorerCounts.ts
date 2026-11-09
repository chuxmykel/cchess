// The opening explorer's numbers, as its list shows them.

/** A count of games short enough for the list's column: "12,345" up to
 * 100,000, then "123k", "4.5M", "12M". */
export function formatGameCount(games: number): string {
  if (games < 100_000) {
    return String(games).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  if (games < 1_000_000) return `${Math.round(games / 1000)}k`;
  const millions = games / 1_000_000;
  return millions < 10
    ? `${Math.round(millions * 10) / 10}M`
    : `${Math.round(millions)}M`;
}

/** `part` of `whole`, as a whole percentage - 0 of none. */
export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

// A game rating: the rating a side played this one game at, judged from its
// accuracy alone - not its real rating, which a single game hardly moves.
// Our own curve, not a published formula: accuracy climbs slowly through
// club play and steeply among masters, where each point is hard won, so
// it's drawn through these points and read straight between them.
const CURVE: [accuracy: number, rating: number][] = [
  [0, 100],
  [40, 400],
  [55, 800],
  [65, 1100],
  [75, 1450],
  [82, 1750],
  [88, 2050],
  [92, 2300],
  [95, 2550],
  [98, 2800],
  [100, 2950],
];

// Rounded to 50, since it's an estimate and shouldn't look exact.
const STEP = 50;

export function gameRating(accuracy: number): number {
  const clamped = Math.max(0, Math.min(100, accuracy));
  for (let i = 1; i < CURVE.length; i++) {
    const [toAccuracy, toRating] = CURVE[i];
    if (clamped > toAccuracy) continue;
    const [fromAccuracy, fromRating] = CURVE[i - 1];
    const share = (clamped - fromAccuracy) / (toAccuracy - fromAccuracy);
    const rating = fromRating + share * (toRating - fromRating);
    return Math.round(rating / STEP) * STEP;
  }
  return CURVE[CURVE.length - 1][1];
}

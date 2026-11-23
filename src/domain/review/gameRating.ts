// A game rating: the rating a side played this one game at - the quality of
// the moves set against what's expected of a player at their rating: so it's anchored on the player's
// rating going into the game, and moved from there by how far their
// accuracy is from what that rating usually plays - above it for a game
// played better than usual, below for one played worse - and over many
// games it averages out near their rating. With no rating to go on (a guest),
// it's read off accuracy alone.

// The rating that usually plays at an accuracy: our own curve, not a
// published formula - accuracy climbs slowly through club play and steeply
// among masters, where each point is hard won - drawn through these points
// and read straight between them.
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

// How far one game moves the rating from the player's own: halfway to what
// its accuracy alone would say - a single game says a lot less than a
// rating built over hundreds.
const WEIGHT = 0.5;

// Rounded to 50, since it's an estimate and shouldn't look exact.
const STEP = 50;

export function ratingForAccuracy(accuracy: number): number {
  const clamped = Math.max(0, Math.min(100, accuracy));
  for (let i = 1; i < CURVE.length; i++) {
    const [toAccuracy, toRating] = CURVE[i];
    if (clamped > toAccuracy) continue;
    const [fromAccuracy, fromRating] = CURVE[i - 1];
    const share = (clamped - fromAccuracy) / (toAccuracy - fromAccuracy);
    return fromRating + share * (toRating - fromRating);
  }
  return CURVE[CURVE.length - 1][1];
}

export function gameRating(
  accuracy: number,
  playerRating: number | null = null,
): number {
  const played = ratingForAccuracy(accuracy);
  const rating =
    playerRating === null
      ? played
      : playerRating + WEIGHT * (played - playerRating);
  return Math.max(STEP, Math.round(rating / STEP) * STEP);
}

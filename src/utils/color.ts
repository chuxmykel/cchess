function channels(hex: string): [number, number, number] {
  let digits = hex.replace('#', '');
  if (digits.length === 3) digits = digits.replace(/./g, (d) => d + d);
  const num = parseInt(digits, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Mixes a hex color toward another - white unless given, so lightening it.
// `amount` ranges from 0 (the color unchanged) to 1 (the other color).
export function tintColor(
  hex: string,
  amount: number,
  toward = '#ffffff',
): string {
  const to = channels(toward);
  const [r, g, b] = channels(hex).map((channel, i) =>
    Math.round(channel + (to[i] - channel) * amount),
  );
  return `rgb(${r}, ${g}, ${b})`;
}

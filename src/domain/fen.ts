export function plyCountFromFen(fen: string): number {
  const [, sideToMove, , , , fullmoveNumber] = fen.split(' ');
  return (Number(fullmoveNumber) - 1) * 2 + (sideToMove === 'b' ? 1 : 0);
}

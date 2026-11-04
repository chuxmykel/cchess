export type MoveSound = 'move' | 'capture' | 'castle' | 'check' | 'checkmate';

/** Every sound a game makes: its moves', and its start's and end's. */
export type GameSound = MoveSound | 'game-start' | 'game-end';

// The sound a move makes, read off its SAN - so a move applied here and one
// in a game's history sound the same. When a move is more than one thing,
// the bigger news wins: mate over check, check over a castle or capture.
export function moveSound(san: string): MoveSound {
  if (san.includes('#')) return 'checkmate';
  if (san.includes('+')) return 'check';
  if (san.startsWith('O-O')) return 'castle';
  if (san.includes('x')) return 'capture';
  return 'move';
}

// The sound of going from one position in a game to another: forward, the
// move that lands there makes its own sound; back, the pieces just slide
// back - taking back a capture isn't one - unless the position landed on is
// a check, which always sounds as one.
export function stepSound(
  sans: string[],
  fromPly: number,
  toPly: number,
): MoveSound | null {
  if (toPly === fromPly) return null;
  return stepSoundTo(fromPly, toPly, toPly > 0 ? sans[toPly - 1] : null);
}

// The same, knowing only the plies and the move that led to where it lands
// (null at the start) - for an analysis, whose moves branch.
export function stepSoundTo(
  fromPly: number,
  toPly: number,
  landedSan: string | null,
): MoveSound {
  const landedOn = landedSan ? moveSound(landedSan) : 'move';
  if (toPly >= fromPly) return landedOn;
  return landedOn === 'check' ? 'check' : 'move';
}

// The sound of a game ending, by how it ended: a mate has already sounded
// with its move, so it adds nothing.
export function gameOverSound(reason: string | null): GameSound | null {
  return reason === 'checkmate' ? null : 'game-end';
}

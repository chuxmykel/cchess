import { Easing, WithTimingConfig } from 'react-native-reanimated';

// The board's animations: quick tweens that ease out, so a piece arrives
// fast and settles onto its square rather than stopping dead on it.
const QUICK: WithTimingConfig = {
  duration: 50,
  easing: Easing.out(Easing.cubic),
};

// A piece travelling to its new square - a move played by tap, the
// opponent's, the rook in a castle. A dragged piece is lifted and set down at
// once instead, as on lichess (see usePieceGesture).
export const MOVE_TIMING = QUICK;

// How much bigger a piece is drawn while it's being dragged.
export const DRAG_SCALE = 2;

// How far above the finger a dragged piece is drawn, in squares: clear of the
// finger, and clearly not on the square the drop counts for - the one under
// the finger, which the guide marks.
export const DRAG_LIFT = 1;

// How long before the finger lifts a drop that's no move is judged again
// from (see usePieceGesture): about two frames, what the guide was showing.
export const DROP_LIFT_GRACE_MS = 35;

// Drawn over every other piece while dragged.
export const DRAGGED_Z_INDEX = 100;

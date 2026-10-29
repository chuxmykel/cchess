import { Easing, WithTimingConfig } from 'react-native-reanimated';

// The board's animations: quick tweens that ease out, so a piece arrives
// fast and settles onto its square rather than stopping dead on it.
const QUICK: WithTimingConfig = {
  duration: 50,
  easing: Easing.out(Easing.cubic),
};

// A piece travelling to its new square - a move, a capture, the rook in a
// castle, or a drop from where the finger let go.
export const MOVE_TIMING = QUICK;

// A piece lifted as a drag starts, and set back down on release.
export const SCALE_TIMING = QUICK;

// A piece going home from a drop that wasn't a move.
export const SNAP_BACK_TIMING = QUICK;

// How much bigger a piece is drawn while it's being dragged.
export const DRAG_SCALE = 1.4;

// Drawn over every other piece while dragged.
export const DRAGGED_Z_INDEX = 100;

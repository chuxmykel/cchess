import type { WithSpringConfig } from 'react-native-reanimated';

// The board's springs. Each is critically damped (damping = 2 * sqrt(stiffness
// * mass)): the fastest settle with no overshoot, so a piece glides onto its
// square rather than bouncing on it.
//
// Reanimated ends a spring once its energy falls below `energyThreshold`. The
// default (6e-9) keeps it ringing invisibly for a few hundred ms near the
// target; 1e-4 is about 1% of the travel, so a move's landing - and whatever
// waits on it, like clearing the captured piece - happens as soon as it looks
// done.

// A piece travelling to its new square - a move, a capture, the rook in a
// castle, or a drop from where the finger let go.
export const MOVE_SPRING: WithSpringConfig = {
  stiffness: 400,
  damping: 40,
  mass: 1,
  energyThreshold: 1e-4,
};

// A piece lifted as a drag starts, and set back down on release.
export const SCALE_SPRING: WithSpringConfig = {
  stiffness: 600,
  damping: 49,
  mass: 1,
};

// A piece going home from a drop that wasn't a move.
export const SNAP_BACK_SPRING: WithSpringConfig = {
  stiffness: 350,
  damping: 37,
  mass: 1,
  energyThreshold: 1e-4,
};

// How much bigger a piece is drawn while it's being dragged.
export const DRAG_SCALE = 1.4;

// Drawn over every other piece while dragged.
export const DRAGGED_Z_INDEX = 100;

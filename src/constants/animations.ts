// The board's springs. Each is critically damped (damping = 2 * sqrt(stiffness
// * mass)): the fastest settle with no overshoot, so a piece glides onto its
// square rather than bouncing on it.

type Spring = { stiffness: number; damping: number; mass: number };

// A piece travelling to its new square - a move, a capture, the rook in a
// castle, or a drop from where the finger let go.
export const MOVE_SPRING: Spring = { stiffness: 400, damping: 40, mass: 1 };

// A piece lifted as a drag starts, and set back down on release.
export const SCALE_SPRING: Spring = { stiffness: 600, damping: 49, mass: 1 };

// A piece going home from a drop that wasn't a move.
export const SNAP_BACK_SPRING: Spring = {
  stiffness: 350,
  damping: 37,
  mass: 1,
};

// How much bigger a piece is drawn while it's being dragged.
export const DRAG_SCALE = 1.4;

// Springs ring on near their target long after anyone can see it; ending
// them within half a point lets a move's landing - and whatever waits on it,
// like clearing the captured piece - happen as soon as it looks done.
export const REST_THRESHOLDS = {
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 5,
};

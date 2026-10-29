// A line for each drop - how the board judged it, and what the game made of
// it - when EXPO_PUBLIC_DEBUG_DRAG=1, for chasing drops that go astray on a
// device. Off otherwise.
export const DRAG_LOG_ENABLED = process.env.EXPO_PUBLIC_DEBUG_DRAG === '1';

export function logDrag(message: string) {
  if (DRAG_LOG_ENABLED) console.log(`[drag] ${message}`);
}

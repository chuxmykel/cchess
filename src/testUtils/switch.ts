import type { TestInstance } from 'test-renderer';

// Whether a Switch is on, as either platform renders it: iOS's host switch
// carries it as `value`, Android's as `on` - and RNTL's toBeChecked knows
// only iOS's.
export function isSwitchOn(element: TestInstance): boolean {
  return Boolean(element.props.value ?? element.props.on);
}

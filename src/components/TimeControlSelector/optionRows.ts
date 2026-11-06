import { TimeControl } from '../../constants/timeControls';

/** How many presets fit a row at most - a group of more, daily's six,
 * wraps into rows of three, so its labels ("14 days") still fit. */
const MAX_ROW = 4;
const WRAPPED_ROW = 3;

/** A group's presets, row by row. */
export function optionRows(options: TimeControl[]): TimeControl[][] {
  if (options.length <= MAX_ROW) return [options];
  const rows: TimeControl[][] = [];
  for (let i = 0; i < options.length; i += WRAPPED_ROW) {
    rows.push(options.slice(i, i + WRAPPED_ROW));
  }
  return rows;
}

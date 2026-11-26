/** Whether `version` ("1.4.0") is older than `minimum` - each dotted part
 * compared as a number, a missing part counting as 0. Anything that isn't a
 * version is never older, so a bad value can't lock players out. */
export function isOlderVersion(version: string, minimum: string): boolean {
  const parse = (text: string) =>
    /^\d+(\.\d+)*$/.test(text) ? text.split('.').map(Number) : null;
  const have = parse(version);
  const need = parse(minimum);
  if (!have || !need) return false;
  for (let i = 0; i < Math.max(have.length, need.length); i++) {
    const difference = (have[i] ?? 0) - (need[i] ?? 0);
    if (difference !== 0) return difference < 0;
  }
  return false;
}

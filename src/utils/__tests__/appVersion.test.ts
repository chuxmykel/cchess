import { isOlderVersion } from '../appVersion';

describe('isOlderVersion', () => {
  it.each([
    ['1.0.0', '1.0.1', true],
    ['1.2', '1.10', true],
    ['2.0.0', '1.9.9', false],
    ['1.0.0', '1.0.0', false],
    ['1.0', '1.0.0', false],
    ['1.0.0', 'not-a-version', false],
    ['dev', '1.0.0', false],
  ])('%s older than %s: %s', (version, minimum, older) => {
    expect(isOlderVersion(version, minimum)).toBe(older);
  });
});

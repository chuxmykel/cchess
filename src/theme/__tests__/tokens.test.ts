import { Platform } from 'react-native';

import { fontFamily } from '../tokens';

describe('fontFamily', () => {
  it("is a monospace font the platform has: Menlo on iOS, Android's own elsewhere", () => {
    expect(fontFamily.mono).toBe(Platform.OS === 'ios' ? 'Menlo' : 'monospace');
  });
});

import { getStateFromPath } from '@react-navigation/native';

import { linking } from './linking';

describe('linking', () => {
  it.each([
    ['app/verify-email?token=abc', 'VerifyEmail'],
    ['app/reset-password?token=abc', 'ResetPassword'],
  ])('opens %s over Home, with the token', (path, screen) => {
    const state = getStateFromPath(path, linking.config);
    const homeStack = state?.routes[0].state;
    expect(homeStack?.routes.map((route) => route.name)).toEqual([
      'HomeTabs',
      screen,
    ]);
    expect(homeStack?.routes[1].params).toEqual({ token: 'abc' });
  });
});

describe('linking in Expo Go', () => {
  it("takes Expo Go's own links too", () => {
    expect(linking.prefixes).toContain('exp://127.0.0.1:8081/--/');
  });
});

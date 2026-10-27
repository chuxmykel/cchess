import { accessTokenExpiresAt } from '../accessToken';
import { makeAccessToken } from '../../testUtils/accessToken';

describe('accessTokenExpiresAt', () => {
  it('reads when a JWT access token expires, in milliseconds', () => {
    const expiresAt = Date.UTC(2026, 9, 27, 12, 15, 0);

    expect(accessTokenExpiresAt(makeAccessToken(expiresAt))).toBe(expiresAt);
  });

  it.each([
    ['not a JWT', 'access-123'],
    ['a payload without exp', `x.${btoa('{"sub":"u"}')}.y`],
    ['an unreadable payload', 'x.%%%.y'],
  ])('is unknown for %s', (_, token) => {
    expect(accessTokenExpiresAt(token)).toBeNull();
  });
});

type AccessTokenClaims = { exp?: number };

const MS_PER_SECOND = 1000;

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  return atob(
    base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='),
  );
}

export function accessTokenExpiresAt(accessToken: string): number | null {
  try {
    const [, payload] = accessToken.split('.');
    const { exp } = JSON.parse(decodeBase64Url(payload)) as AccessTokenClaims;
    return typeof exp === 'number' ? exp * MS_PER_SECOND : null;
  } catch {
    return null;
  }
}

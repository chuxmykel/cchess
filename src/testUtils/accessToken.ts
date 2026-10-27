function encodeBase64Url(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function makeAccessToken(expiresAtMs: number, subject = 'user-1') {
  const header = encodeBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeBase64Url({
    sub: subject,
    exp: Math.floor(expiresAtMs / 1000),
  });
  return `${header}.${payload}.signature`;
}

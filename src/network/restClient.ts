import { SERVER_URL } from './env';
import { AuthTokens } from './tokenStorage';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, message || response.statusText);
  }
}

export async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}

export async function getAuthenticatedText(
  path: string,
  accessToken: string,
): Promise<string> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await throwIfNotOk(response);
  return response.text();
}

export function getGamePgn(
  gameId: string,
  accessToken: string,
): Promise<string> {
  return getAuthenticatedText(
    `/games/${encodeURIComponent(gameId)}/pgn`,
    accessToken,
  );
}

export type GuestSession = AuthTokens;

// Assumed response shape - cchess-be's actual /auth/guest response hasn't
// been verified against this client yet; adjust the field names here if it
// differs once tested against a live server.
type GuestSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string };
};

export async function createGuestSession(): Promise<GuestSession> {
  const response = await postJson<GuestSessionResponse>('/auth/guest');
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  };
}

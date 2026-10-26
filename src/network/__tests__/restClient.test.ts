import {
  ApiError,
  createGuestSession,
  getGamePgn,
  getAuthenticatedText,
  postJson,
} from '../restClient';
import { SERVER_URL } from '../env';

describe('postJson', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs JSON and resolves with the parsed response', async () => {
    const json = jest.fn().mockResolvedValue({ ok: true });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json,
    } as unknown as Response);

    const result = await postJson('/some/path', { a: 1 });

    expect(global.fetch).toHaveBeenCalledWith(`${SERVER_URL}/some/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 1 }),
    });
    expect(result).toEqual({ ok: true });
  });

  it('throws an ApiError on a non-2xx response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue('boom'),
    } as unknown as Response);

    await expect(postJson('/fails')).rejects.toThrow(ApiError);
  });
});

describe('createGuestSession', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the /auth/guest response into a flat session shape', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 'user-789' },
      }),
    } as unknown as Response);

    const session = await createGuestSession();

    expect(session).toEqual({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      userId: 'user-789',
    });
  });
});

describe('getAuthenticatedText', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GETs with the bearer token and resolves with the response text', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('1. e4 e5'),
    } as unknown as Response);

    const result = await getAuthenticatedText('/some/text', 'token-123');

    expect(global.fetch).toHaveBeenCalledWith(`${SERVER_URL}/some/text`, {
      method: 'GET',
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(result).toBe('1. e4 e5');
  });

  it('throws an ApiError on a non-2xx response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: jest.fn().mockResolvedValue('Game not found'),
    } as unknown as Response);

    await expect(getAuthenticatedText('/missing', 'token')).rejects.toThrow(
      ApiError,
    );
  });
});

describe('getGamePgn', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches the game's PGN endpoint", async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('[Event "Casual"]'),
    } as unknown as Response);

    await expect(getGamePgn('game-1', 'token')).resolves.toBe(
      '[Event "Casual"]',
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${SERVER_URL}/games/game-1/pgn`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

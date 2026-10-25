import { ApiError, createGuestSession, postJson } from '../restClient';
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

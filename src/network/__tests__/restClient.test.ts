import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  apiClient,
  ApiError,
  createGuestSession,
  getGamePgn,
  getMe,
  isGameBookmarked,
  setGameBookmarked,
  getMyGames,
  isUsernameAvailable,
  refreshSession,
  register,
  revokeRefreshToken,
  searchUsers,
  signIn,
} from '../restClient';

const AUTH_RESPONSE = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  user: {
    id: 'user-789',
    username: 'magnus',
    displayName: 'magnus',
    avatarColor: '#123456',
    isGuest: false,
    ratings: [],
  },
};

function respondWith(data: unknown) {
  return jest.fn(
    async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }),
  );
}

function failWith(status: number, data: unknown) {
  return jest.fn(async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    });
  });
}

function stubTransport(adapter: ReturnType<typeof respondWith>) {
  apiClient.defaults.adapter = adapter;
  return adapter;
}

function sentRequest(
  adapter: ReturnType<typeof respondWith>,
): InternalAxiosRequestConfig {
  return adapter.mock.calls[0][0];
}

describe('restClient', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  describe('auth', () => {
    it.each([
      [
        'createGuestSession',
        () => createGuestSession(),
        '/auth/guest',
        undefined,
      ],
      [
        'signIn',
        () => signIn({ usernameOrEmail: 'magnus', password: 'secret123' }),
        '/auth/login',
        { usernameOrEmail: 'magnus', password: 'secret123' },
      ],
      [
        'register',
        () =>
          register({
            username: 'magnus',
            email: 'm@example.com',
            password: 'secret123',
          }),
        '/auth/register',
        { username: 'magnus', email: 'm@example.com', password: 'secret123' },
      ],
      [
        'refreshSession',
        () => refreshSession('refresh-456'),
        '/auth/refresh',
        { refreshToken: 'refresh-456' },
      ],
    ])(
      '%s POSTs to %s and resolves with the session',
      async (_, call, url, body) => {
        const transport = stubTransport(respondWith(AUTH_RESPONSE));

        await expect(call()).resolves.toEqual(AUTH_RESPONSE);

        const request = sentRequest(transport);
        expect(request.method).toBe('post');
        expect(request.url).toBe(url);
        expect(request.data && JSON.parse(request.data)).toEqual(body);
      },
    );

    it('revokes a refresh token through /auth/logout', async () => {
      const transport = stubTransport(respondWith(''));

      await revokeRefreshToken('refresh-456');

      const request = sentRequest(transport);
      expect(request.url).toBe('/auth/logout');
      expect(JSON.parse(request.data)).toEqual({ refreshToken: 'refresh-456' });
    });
  });

  describe('authenticated requests', () => {
    it("fetches the signed-in user's profile with the bearer token", async () => {
      const transport = stubTransport(respondWith(AUTH_RESPONSE.user));

      await expect(getMe('access-123')).resolves.toEqual(AUTH_RESPONSE.user);

      const request = sentRequest(transport);
      expect(request.url).toBe('/users/me');
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    describe('isUsernameAvailable', () => {
      it('is available when no user has that name', async () => {
        const transport = stubTransport(
          failWith(404, { message: 'User not found' }),
        );

        await expect(isUsernameAvailable('magnus', 'access-123')).resolves.toBe(
          true,
        );
        const request = sentRequest(transport);
        expect(request.url).toBe('/users/magnus');
        expect(request.headers.Authorization).toBe('Bearer access-123');
      });

      it('is taken when a user has that name', async () => {
        stubTransport(respondWith(AUTH_RESPONSE.user));

        await expect(isUsernameAvailable('magnus', 'access-123')).resolves.toBe(
          false,
        );
      });

      it("rejects when the server can't say either way", async () => {
        stubTransport(failWith(500, { message: 'boom' }));

        await expect(
          isUsernameAvailable('magnus', 'access-123'),
        ).rejects.toBeInstanceOf(ApiError);
      });
    });

    it('fetches my most recent games, limited to the given count', async () => {
      const transport = stubTransport(respondWith([]));

      await getMyGames('access-123', 10);

      const request = sentRequest(transport);
      expect(request.url).toBe('/games');
      expect(request.params).toEqual({ limit: 10 });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it('searches for players by name', async () => {
      const transport = stubTransport(respondWith([]));

      await searchUsers('mag', 'access-123');

      const request = sentRequest(transport);
      expect(request.url).toBe('/users');
      expect(request.params).toEqual({ search: 'mag', limit: 10 });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it("fetches a game's PGN as text", async () => {
      const transport = stubTransport(respondWith('[Event "Casual"]'));

      await expect(getGamePgn('game 1', 'access-123')).resolves.toBe(
        '[Event "Casual"]',
      );

      const request = sentRequest(transport);
      expect(request.url).toBe('/games/game%201/pgn');
      expect(request.responseType).toBe('text');
    });
  });

  describe('bookmarks', () => {
    it('asks whether a game is bookmarked', async () => {
      const transport = stubTransport(respondWith({ bookmarked: true }));

      await expect(isGameBookmarked('game 1', 'access-123')).resolves.toBe(
        true,
      );

      const request = sentRequest(transport);
      expect(request.method).toBe('get');
      expect(request.url).toBe('/games/game%201/bookmark');
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it('bookmarks with PUT and removes the bookmark with DELETE', async () => {
      const transport = stubTransport(respondWith({ bookmarked: true }));
      await expect(
        setGameBookmarked('game-1', true, 'access-123'),
      ).resolves.toBe(true);
      expect(sentRequest(transport).method).toBe('put');

      const removal = stubTransport(respondWith({ bookmarked: false }));
      await expect(
        setGameBookmarked('game-1', false, 'access-123'),
      ).resolves.toBe(false);
      expect(sentRequest(removal).method).toBe('delete');
    });
  });

  describe('errors', () => {
    it("rejects with an ApiError carrying the server's status and message", async () => {
      stubTransport(
        failWith(409, {
          statusCode: 409,
          message: 'Username is already taken',
        }),
      );

      const failure = register({
        username: 'magnus',
        email: 'm@example.com',
        password: 'secret123',
      });

      await expect(failure).rejects.toBeInstanceOf(ApiError);
      await expect(failure).rejects.toMatchObject({
        status: 409,
        message: 'Username is already taken',
      });
    });

    it('puts each validation message on its own line', async () => {
      stubTransport(
        failWith(400, {
          message: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
        }),
      );

      await expect(
        register({ username: 'magnus', email: 'nope', password: 'short' }),
      ).rejects.toMatchObject({
        message:
          'email must be an email\npassword must be longer than or equal to 8 characters',
      });
    });

    it("falls back to axios's own message when the server sent none", async () => {
      stubTransport(failWith(502, undefined));

      await expect(createGuestSession()).rejects.toMatchObject({
        status: 502,
        message: 'Request failed',
      });
    });
  });
});

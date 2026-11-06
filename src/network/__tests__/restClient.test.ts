import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  apiClient,
  ApiError,
  createGuestSession,
  getGamePgn,
  getMe,
  isGameBookmarked,
  setGameBookmarked,
  cancelDailySeek,
  createDailySeek,
  getConditionalMoves,
  saveConditionalMoves,
  getDailyGames,
  getExplorer,
  getGameNotes,
  saveGameNotes,
  getMyActiveGame,
  getMyDailySeeks,
  getMyGames,
  getUserGames,
  isUsernameAvailable,
  refreshSession,
  register,
  revokeRefreshToken,
  getRatingStats,
  getUserFriends,
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

    it('fetches my most recent finished games, limited to the given count', async () => {
      const transport = stubTransport(respondWith([]));

      await getMyGames('access-123', 10);

      const request = sentRequest(transport);
      expect(request.url).toBe('/games');
      expect(request.params).toEqual({ limit: 10, status: 'completed' });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it("fetches a player's finished games, a page at a time", async () => {
      const transport = stubTransport(respondWith([]));

      await getUserGames(
        'magnus',
        { limit: 20, before: '2026-01-01T00:00:00.000Z' },
        'access-123',
      );

      const request = sentRequest(transport);
      expect(request.url).toBe('/users/magnus/games');
      expect(request.params).toEqual({
        limit: 20,
        before: '2026-01-01T00:00:00.000Z',
        status: 'completed',
      });
    });

    it("finds the live game you're in the middle of, not a daily one", async () => {
      const transport = stubTransport(respondWith([{ id: 'live-game' }]));

      await expect(getMyActiveGame('access-123')).resolves.toEqual({
        id: 'live-game',
      });

      const request = sentRequest(transport);
      expect(request.url).toBe('/games');
      expect(request.params).toEqual({
        status: 'active',
        kind: 'live',
        limit: 1,
      });
    });

    it('fetches your daily games in progress', async () => {
      const transport = stubTransport(respondWith([{ id: 'daily-game' }]));

      await expect(getDailyGames('access-123', 10)).resolves.toEqual([
        { id: 'daily-game' },
      ]);

      const request = sentRequest(transport);
      expect(request.url).toBe('/games/daily');
      expect(request.params).toEqual({ limit: 10 });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it('asks the explorer about a position', async () => {
      const transport = stubTransport(
        respondWith({ totalGames: 0, moves: [] }),
      );

      await getExplorer('8/8/8/8/8/8/8/K6k w - - 0 1', 'access-123');

      expect(sentRequest(transport).url).toBe('/explorer');
      expect(sentRequest(transport).params).toEqual({
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
      });
    });

    it('reads and saves conditional moves, all at once', async () => {
      const reading = stubTransport(respondWith({ basePly: null, lines: [] }));
      await getConditionalMoves('game-1', 'access-123');
      expect(sentRequest(reading).url).toBe('/games/game-1/conditional-moves');

      const saving = stubTransport(respondWith({ basePly: 3, lines: [] }));
      await saveConditionalMoves('game-1', 3, [['e7e5', 'g1f3']], 'access-123');
      expect(sentRequest(saving).method).toBe('put');
      expect(JSON.parse(sentRequest(saving).data)).toEqual({
        basePly: 3,
        lines: [['e7e5', 'g1f3']],
      });
    });

    it('reads and saves your notes on a game', async () => {
      const reading = stubTransport(respondWith({ body: '', updatedAt: null }));
      await getGameNotes('game-1', 'access-123');
      expect(sentRequest(reading).url).toBe('/games/game-1/notes');

      const saving = stubTransport(respondWith({ body: 'x', updatedAt: null }));
      await saveGameNotes('game-1', 'x', 'access-123');
      expect(sentRequest(saving).method).toBe('put');
      expect(JSON.parse(sentRequest(saving).data)).toEqual({ body: 'x' });
    });

    it('posts, lists and withdraws daily seeks', async () => {
      const seek = {
        days: 3,
        rated: true,
        ratingRange: { below: 200, above: 200 },
        color: 'random' as const,
      };
      const posting = stubTransport(respondWith({ status: 'queued' }));
      await createDailySeek(seek, 'access-123');
      expect(sentRequest(posting).method).toBe('post');
      expect(sentRequest(posting).url).toBe('/daily-seeks');
      expect(JSON.parse(sentRequest(posting).data)).toEqual(seek);

      const listing = stubTransport(respondWith([]));
      await getMyDailySeeks('access-123');
      expect(sentRequest(listing).url).toBe('/daily-seeks');

      const withdrawing = stubTransport(respondWith(null));
      await cancelDailySeek('seek-1', 'access-123');
      expect(sentRequest(withdrawing).method).toBe('delete');
      expect(sentRequest(withdrawing).url).toBe('/daily-seeks/seek-1');
    });

    it('finds no game when none is in progress', async () => {
      stubTransport(respondWith([]));

      await expect(getMyActiveGame('access-123')).resolves.toBeNull();
    });

    it('searches for players by name', async () => {
      const transport = stubTransport(respondWith([]));

      await searchUsers('mag', 'access-123', { limit: 20, offset: 40 });

      const request = sentRequest(transport);
      expect(request.url).toBe('/users');
      expect(request.params).toEqual({ search: 'mag', limit: 20, offset: 40 });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it("fetches a player's stats in one category over a period", async () => {
      const transport = stubTransport(respondWith({}));

      await getRatingStats('judit polgar', 'blitz', '3m', 'access-123');

      const request = sentRequest(transport);
      expect(request.url).toBe('/users/judit%20polgar/ratings/blitz');
      expect(request.params).toEqual({ period: '3m' });
      expect(request.headers.Authorization).toBe('Bearer access-123');
    });

    it("fetches a player's friends", async () => {
      const transport = stubTransport(respondWith([]));

      await getUserFriends('judit polgar', 'access-123');

      const request = sentRequest(transport);
      expect(request.url).toBe('/users/judit%20polgar/friends');
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

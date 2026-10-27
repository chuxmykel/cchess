import { act, renderHook } from '@testing-library/react-native';

import { RECENT_GAMES_STATUS, useRecentGames } from '../useRecentGames';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, getMyGames } from '../../network/restClient';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';
import { makeGameSummary } from '../../testUtils/gameSummary';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyGames: jest.fn(),
}));

const FINISHED = makeGameSummary({ id: 'finished' });
const ABORTED = makeGameSummary({
  id: 'aborted',
  status: 'aborted',
  result: null,
});
const IN_PROGRESS = makeGameSummary({
  id: 'in-progress',
  status: 'active',
  result: null,
});

function deferred<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

describe('useRecentGames', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is loading until the first reload finishes', async () => {
    const { result } = await renderHook(() => useRecentGames(10));

    expect(result.current.recentGames.status).toBe(RECENT_GAMES_STATUS.LOADING);
    expect(getMyGames).not.toHaveBeenCalled();
  });

  it('loads my finished games, leaving out one still in progress', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      IN_PROGRESS,
      FINISHED,
      ABORTED,
    ]);
    const { result } = await renderHook(() => useRecentGames(10));

    await act(async () => result.current.reload());

    expect(getMyGames).toHaveBeenCalledWith('token-a', 10);
    expect(result.current.recentGames).toEqual({
      status: RECENT_GAMES_STATUS.READY,
      games: [FINISHED, ABORTED],
    });
  });

  it("reports an error when the games can't be loaded", async () => {
    (getMyGames as jest.Mock).mockRejectedValue(new ApiError(500, 'boom'));
    const { result } = await renderHook(() => useRecentGames(10));

    await act(async () => result.current.reload());

    expect(result.current.recentGames.status).toBe(RECENT_GAMES_STATUS.ERROR);
  });

  it('keeps showing the games it has when a later reload fails', async () => {
    (getMyGames as jest.Mock)
      .mockResolvedValueOnce([FINISHED])
      .mockRejectedValueOnce(new ApiError(0, 'Network Error'));
    const { result } = await renderHook(() => useRecentGames(10));

    await act(async () => result.current.reload());
    await act(async () => result.current.reload());

    expect(result.current.recentGames).toEqual({
      status: RECENT_GAMES_STATUS.READY,
      games: [FINISHED],
    });
  });

  it("goes back to loading when the account changes, instead of showing the last account's games", async () => {
    (getMyGames as jest.Mock).mockResolvedValue([FINISHED]);
    const { result, rerender } = await renderHook(() => useRecentGames(10));
    await act(async () => result.current.reload());

    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { id: 'another-user' } }),
    );
    await rerender({});

    expect(result.current.recentGames.status).toBe(RECENT_GAMES_STATUS.LOADING);
  });

  it('keeps showing the games when only the access token is refreshed', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([FINISHED]);
    const { result, rerender } = await renderHook(() => useRecentGames(10));
    await act(async () => result.current.reload());

    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'refreshed-token' }),
    );
    await rerender({});

    expect(result.current.recentGames).toEqual({
      status: RECENT_GAMES_STATUS.READY,
      games: [FINISHED],
    });
  });

  it('ignores a slower, earlier response once a newer one has arrived', async () => {
    const slow = deferred<unknown[]>();
    (getMyGames as jest.Mock)
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce([ABORTED]);
    const { result } = await renderHook(() => useRecentGames(10));

    await act(async () => result.current.reload());
    await act(async () => result.current.reload());
    await act(async () => slow.resolve([FINISHED]));

    expect(result.current.recentGames).toEqual({
      status: RECENT_GAMES_STATUS.READY,
      games: [ABORTED],
    });
  });

  it("doesn't fetch before the session is ready", async () => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeBootstrappingAuthSession(),
    );
    const { result } = await renderHook(() => useRecentGames(10));

    await act(async () => result.current.reload());

    expect(getMyGames).not.toHaveBeenCalled();
    expect(result.current.recentGames.status).toBe(RECENT_GAMES_STATUS.LOADING);
  });
});

import { act, renderHook } from '@testing-library/react-native';

import {
  DAILY_GAMES_STATUS,
  nextDailyGame,
  useDailyGames,
} from '../useDailyGames';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, getDailyGames } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeDailyGame } from '../../testUtils/dailyGame';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getDailyGames: jest.fn(),
}));

const MINE = makeDailyGame({ id: 'mine' });
const THEIRS = makeDailyGame({ id: 'theirs', myTurn: false, turn: 'b' });

describe('useDailyGames', () => {
  let fake: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a', socket: fake.socket }),
    );
    (getDailyGames as jest.Mock).mockResolvedValue([MINE, THEIRS]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is loading until the first reload finishes', async () => {
    const { result } = await renderHook(() => useDailyGames(10));

    expect(result.current.dailyGames.status).toBe(DAILY_GAMES_STATUS.LOADING);
  });

  it('loads your daily games in progress, in the order the server lists them', async () => {
    const { result } = await renderHook(() => useDailyGames(10));

    await act(async () => result.current.reload());

    expect(getDailyGames).toHaveBeenCalledWith('token-a', 10);
    expect(result.current.dailyGames).toEqual({
      status: DAILY_GAMES_STATUS.READY,
      games: [MINE, THEIRS],
    });
  });

  it('keeps the list it has when a refresh fails, and reports a first failure', async () => {
    const { result } = await renderHook(() => useDailyGames(10));
    await act(async () => result.current.reload());

    (getDailyGames as jest.Mock).mockRejectedValue(new ApiError(500, 'boom'));
    await act(async () => result.current.reload());

    expect(result.current.dailyGames.status).toBe(DAILY_GAMES_STATUS.READY);

    const fresh = await renderHook(() => useDailyGames(10));
    await act(async () => fresh.result.current.reload());
    expect(fresh.result.current.dailyGames.status).toBe(
      DAILY_GAMES_STATUS.ERROR,
    );
  });

  it("reloads when one of its games moves or ends, or a daily game starts - not for another game's", async () => {
    const { result } = await renderHook(() => useDailyGames(10));
    await act(async () => result.current.reload());
    (getDailyGames as jest.Mock).mockClear();

    await act(async () => fake.trigger('game:move', { gameId: 'live-game' }));
    expect(getDailyGames).not.toHaveBeenCalled();

    await act(async () => fake.trigger('game:move', { gameId: 'theirs' }));
    await act(async () =>
      fake.trigger('game:over', makeGameSnapshot({ id: 'mine' })),
    );
    await act(async () =>
      fake.trigger(
        'game:created',
        makeGameSnapshot({ id: 'new', gameType: 'daily' }),
      ),
    );
    expect(getDailyGames).toHaveBeenCalledTimes(3);
  });
});

describe('nextDailyGame', () => {
  const games = [
    makeDailyGame({ id: 'a' }),
    makeDailyGame({ id: 'b' }),
    makeDailyGame({ id: 'c', myTurn: false }),
  ];

  it('is the one after this game, going round to the start', () => {
    expect(nextDailyGame(games, 'a')?.id).toBe('b');
    expect(nextDailyGame(games, 'c')?.id).toBe('a');
  });

  it("is the first when this game isn't listed - it's over, say", () => {
    expect(nextDailyGame(games, 'gone')?.id).toBe('a');
  });

  it("is none when there's no other game", () => {
    expect(nextDailyGame([games[0]], 'a')).toBeNull();
    expect(nextDailyGame([], 'a')).toBeNull();
  });
});

import { act, renderHook } from '@testing-library/react-native';

import { useRatingStats } from '../useRatingStats';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getRatingStats, RatingPeriod } from '../../network/restClient';
import { GameType } from '../../domain/types';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeRatingStats } from '../../testUtils/ratingStats';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getRatingStats: jest.fn(),
}));

describe('useRatingStats', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads the player's stats for the category and period", async () => {
    const stats = makeRatingStats();
    (getRatingStats as jest.Mock).mockResolvedValue(stats);

    const { result } = await renderHook(() =>
      useRatingStats('judit', 'blitz', '1m'),
    );
    await act(async () => {});

    expect(getRatingStats).toHaveBeenCalledWith(
      'judit',
      'blitz',
      '1m',
      'access-token',
    );
    expect(result.current.state).toEqual({
      status: 'ready',
      stats,
      isUpdating: false,
      didFail: false,
    });
  });

  it("keeps the last period's stats shown while the next one loads", async () => {
    const monthStats = makeRatingStats({ period: '1m' });
    const yearStats = makeRatingStats({ period: '1y' });
    let resolveYear: (stats: typeof yearStats) => void = () => {};
    (getRatingStats as jest.Mock)
      .mockResolvedValueOnce(monthStats)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveYear = resolve;
        }),
      );
    const { result, rerender } = await renderHook(
      ({ period }: { period: RatingPeriod }) =>
        useRatingStats('judit', 'blitz', period),
      { initialProps: { period: '1m' } },
    );
    await act(async () => {});

    await rerender({ period: '1y' });

    expect(result.current.state).toEqual({
      status: 'ready',
      stats: monthStats,
      isUpdating: true,
      didFail: false,
    });
    await act(async () => resolveYear(yearStats));
    expect(result.current.state).toEqual({
      status: 'ready',
      stats: yearStats,
      isUpdating: false,
      didFail: false,
    });
  });

  it("keeps the last period's stats shown when the next one fails", async () => {
    const monthStats = makeRatingStats({ period: '1m' });
    (getRatingStats as jest.Mock)
      .mockResolvedValueOnce(monthStats)
      .mockRejectedValueOnce(new Error('offline'));
    const { result, rerender } = await renderHook(
      ({ period }: { period: RatingPeriod }) =>
        useRatingStats('judit', 'blitz', period),
      { initialProps: { period: '1m' } },
    );
    await act(async () => {});

    await rerender({ period: '1y' });
    await act(async () => {});

    expect(result.current.state).toEqual({
      status: 'ready',
      stats: monthStats,
      isUpdating: false,
      didFail: true,
    });
  });

  it("keeps the last category's stats shown while the next one loads", async () => {
    const blitzStats = makeRatingStats();
    (getRatingStats as jest.Mock)
      .mockResolvedValueOnce(blitzStats)
      .mockReturnValueOnce(new Promise(() => {}));
    const { result, rerender } = await renderHook(
      ({ category }: { category: GameType }) =>
        useRatingStats('judit', category, '1m'),
      { initialProps: { category: 'blitz' } },
    );
    await act(async () => {});

    await rerender({ category: 'rapid' });

    expect(getRatingStats).toHaveBeenLastCalledWith(
      'judit',
      'rapid',
      '1m',
      'access-token',
    );
    expect(result.current.state).toMatchObject({
      stats: blitzStats,
      isUpdating: true,
    });
  });

  it('reports stats that fail to load', async () => {
    (getRatingStats as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() =>
      useRatingStats('judit', 'blitz', '1m'),
    );
    await act(async () => {});

    expect(result.current.state).toEqual({ status: 'error' });
  });
});

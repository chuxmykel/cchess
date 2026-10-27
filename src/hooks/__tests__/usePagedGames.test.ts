import { act, renderHook } from '@testing-library/react-native';

import { usePagedGames } from '../usePagedGames';
import { useAuthSession } from '../../context/AuthSessionContext';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeGameSummary } from '../../testUtils/gameSummary';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

const PAGE_SIZE = 2;

describe('usePagedGames', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });

  async function renderPaged(fetchPage: jest.Mock) {
    const rendered = await renderHook(() =>
      usePagedGames(fetchPage, PAGE_SIZE),
    );
    await act(async () => {});
    return rendered;
  }

  it('loads the first page, leaving out a game in progress', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue([
        makeGameSummary({ id: 'live', status: 'active', result: null }),
        makeGameSummary({ id: 'done' }),
      ]);

    const { result } = await renderPaged(fetchPage);

    expect(fetchPage).toHaveBeenCalledWith(
      { limit: PAGE_SIZE, before: undefined },
      'access-token',
    );
    expect(result.current.status).toBe('ready');
    expect(result.current.games.map((g) => g.id)).toEqual(['done']);
  });

  it('loads older games from before the oldest one shown', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce([
        makeGameSummary({ id: 'a', createdAt: '2026-10-27T10:00:00.000Z' }),
        makeGameSummary({ id: 'b', createdAt: '2026-10-26T10:00:00.000Z' }),
      ])
      .mockResolvedValueOnce([
        makeGameSummary({ id: 'c', createdAt: '2026-10-25T10:00:00.000Z' }),
      ]);
    const { result } = await renderPaged(fetchPage);
    expect(result.current.hasMore).toBe(true);

    await act(async () => result.current.loadMore());

    expect(fetchPage).toHaveBeenLastCalledWith(
      { limit: PAGE_SIZE, before: '2026-10-26T10:00:00.000Z' },
      'access-token',
    );
    expect(result.current.games.map((g) => g.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
  });

  it('reports a first page that fails to load', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('offline'));

    const { result } = await renderPaged(fetchPage);

    expect(result.current.status).toBe('error');
  });
});

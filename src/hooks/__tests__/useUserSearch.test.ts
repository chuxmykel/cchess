import { act, renderHook } from '@testing-library/react-native';

import {
  USER_SEARCH_DELAY_MS,
  USER_SEARCH_PAGE_SIZE,
  useUserSearch,
} from '../useUserSearch';
import { useAuthSession } from '../../context/AuthSessionContext';
import { searchUsers } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  searchUsers: jest.fn(),
}));

const JUDIT = {
  id: 'judit-id',
  username: 'judit',
  displayName: 'Judit Polgar',
  avatarColor: '#D64545',
};

function players(count: number, from = 0) {
  return Array.from({ length: count }, (_, index) => ({
    ...JUDIT,
    id: `player-${from + index}`,
    username: `player_${from + index}`,
  }));
}

describe('useUserSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function renderSearch(initialQuery: string) {
    return renderHook(({ query }: { query: string }) => useUserSearch(query), {
      initialProps: { query: initialQuery },
    });
  }

  async function finishSearch() {
    await act(async () => {
      jest.advanceTimersByTime(USER_SEARCH_DELAY_MS);
    });
  }

  it("doesn't search for a single letter", async () => {
    const { result } = await renderSearch(' j ');

    await finishSearch();

    expect(result.current).toEqual({ status: 'idle' });
    expect(searchUsers).not.toHaveBeenCalled();
  });

  it('searches once typing pauses', async () => {
    (searchUsers as jest.Mock).mockResolvedValue([JUDIT]);
    const { result } = await renderSearch('jud');
    expect(result.current).toEqual({ status: 'searching' });

    await finishSearch();

    expect(searchUsers).toHaveBeenCalledWith('jud', 'token-a', {
      limit: USER_SEARCH_PAGE_SIZE,
      offset: 0,
    });
    expect(result.current).toMatchObject({
      status: 'done',
      results: [JUDIT],
      hasMore: false,
      isLoadingMore: false,
    });
  });

  it('fetches the next page when asked, while there may be more', async () => {
    const firstPage = players(USER_SEARCH_PAGE_SIZE);
    (searchUsers as jest.Mock).mockResolvedValueOnce(firstPage);
    const { result } = await renderSearch('player');
    await finishSearch();
    expect(result.current).toMatchObject({ hasMore: true });

    (searchUsers as jest.Mock).mockResolvedValueOnce(
      players(3, USER_SEARCH_PAGE_SIZE),
    );
    await act(async () => {
      if (result.current.status === 'done') result.current.loadMore();
    });

    expect(searchUsers).toHaveBeenLastCalledWith('player', 'token-a', {
      limit: USER_SEARCH_PAGE_SIZE,
      offset: USER_SEARCH_PAGE_SIZE,
    });
    expect(result.current).toMatchObject({
      status: 'done',
      hasMore: false,
      isLoadingMore: false,
    });
    if (result.current.status !== 'done') throw new Error('not done');
    expect(result.current.results).toHaveLength(USER_SEARCH_PAGE_SIZE + 3);

    await act(
      async () => result.current.status === 'done' && result.current.loadMore(),
    );
    expect(searchUsers).toHaveBeenCalledTimes(2);
  });

  it('keeps what it has when the next page fails', async () => {
    (searchUsers as jest.Mock).mockResolvedValueOnce(
      players(USER_SEARCH_PAGE_SIZE),
    );
    const { result } = await renderSearch('player');
    await finishSearch();

    (searchUsers as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      if (result.current.status === 'done') result.current.loadMore();
    });

    expect(result.current).toMatchObject({
      status: 'done',
      hasMore: true,
      isLoadingMore: false,
    });
  });

  it('asks only for the latest text while typing', async () => {
    (searchUsers as jest.Mock).mockResolvedValue([JUDIT]);
    const { rerender } = await renderSearch('ju');

    await rerender({ query: 'jud' });
    await finishSearch();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith('jud', 'token-a', {
      limit: USER_SEARCH_PAGE_SIZE,
      offset: 0,
    });
  });

  it('reports a failed search', async () => {
    (searchUsers as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = await renderSearch('jud');

    await finishSearch();

    expect(result.current).toEqual({ status: 'error' });
  });
});

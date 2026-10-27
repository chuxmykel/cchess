import { act, renderHook } from '@testing-library/react-native';

import { USER_SEARCH_DELAY_MS, useUserSearch } from '../useUserSearch';
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

    expect(searchUsers).toHaveBeenCalledWith('jud', 'token-a');
    expect(result.current).toEqual({ status: 'done', results: [JUDIT] });
  });

  it('asks only for the latest text while typing', async () => {
    (searchUsers as jest.Mock).mockResolvedValue([JUDIT]);
    const { rerender } = await renderSearch('ju');

    await rerender({ query: 'jud' });
    await finishSearch();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith('jud', 'token-a');
  });

  it('reports a failed search', async () => {
    (searchUsers as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = await renderSearch('jud');

    await finishSearch();

    expect(result.current).toEqual({ status: 'error' });
  });
});

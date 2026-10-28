import { act, renderHook } from '@testing-library/react-native';

import { useUserFriends } from '../useUserFriends';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getUserFriends } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeUserFriend } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getUserFriends: jest.fn(),
}));

describe('useUserFriends', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads the player's friends", async () => {
    const friends = [makeUserFriend()];
    (getUserFriends as jest.Mock).mockResolvedValue(friends);

    const { result } = await renderHook(() => useUserFriends('judit'));
    await act(async () => {});

    expect(getUserFriends).toHaveBeenCalledWith('judit', 'access-token');
    expect(result.current.state).toEqual({ status: 'ready', friends });
  });

  it('keeps the friends shown when a reload fails', async () => {
    (getUserFriends as jest.Mock).mockResolvedValueOnce([makeUserFriend()]);
    const { result } = await renderHook(() => useUserFriends('judit'));
    await act(async () => {});

    (getUserFriends as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.reload());

    expect(result.current.state.status).toBe('ready');
  });

  it('reports friends that fail to load', async () => {
    (getUserFriends as jest.Mock).mockRejectedValue(new Error('not found'));

    const { result } = await renderHook(() => useUserFriends('nobody'));
    await act(async () => {});

    expect(result.current.state).toEqual({ status: 'error' });
  });
});

import { act, renderHook } from '@testing-library/react-native';

import { useUserProfile } from '../useUserProfile';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getUserActivity, getUserProfile } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeUserProfile } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getUserProfile: jest.fn(),
  getUserActivity: jest.fn(),
}));

describe('useUserProfile', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads the player's profile and activity", async () => {
    const profile = makeUserProfile();
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (getUserActivity as jest.Mock).mockResolvedValue([]);

    const { result } = await renderHook(() => useUserProfile('judit'));
    await act(async () => {});

    expect(getUserProfile).toHaveBeenCalledWith('judit', 'access-token');
    expect(result.current.state).toEqual({
      status: 'ready',
      profile,
      activity: [],
    });
  });

  it('keeps the profile shown when a reload fails', async () => {
    const profile = makeUserProfile();
    (getUserProfile as jest.Mock).mockResolvedValueOnce(profile);
    (getUserActivity as jest.Mock).mockResolvedValue([]);
    const { result } = await renderHook(() => useUserProfile('judit'));
    await act(async () => {});

    (getUserProfile as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.reload());

    expect(result.current.state.status).toBe('ready');
  });

  it('reports a profile that fails to load', async () => {
    (getUserProfile as jest.Mock).mockRejectedValue(new Error('not found'));
    (getUserActivity as jest.Mock).mockResolvedValue([]);

    const { result } = await renderHook(() => useUserProfile('nobody'));
    await act(async () => {});

    expect(result.current.state).toEqual({ status: 'error' });
  });
});

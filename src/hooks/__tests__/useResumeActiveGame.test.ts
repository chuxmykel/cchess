import { act, renderHook } from '@testing-library/react-native';

import { useResumeActiveGame } from '../useResumeActiveGame';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getMyActiveGame } from '../../network/restClient';
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
  getMyActiveGame: jest.fn(),
}));

describe('useResumeActiveGame', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens the game the player is in the middle of', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getMyActiveGame as jest.Mock).mockResolvedValue(
      makeGameSummary({ id: 'live-game' }),
    );
    const onResume = jest.fn();

    await renderHook(() => useResumeActiveGame(onResume));
    await act(async () => {});

    expect(getMyActiveGame).toHaveBeenCalledWith('access-token');
    expect(onResume).toHaveBeenCalledWith('live-game');
  });

  it('stays put without a game in progress', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getMyActiveGame as jest.Mock).mockResolvedValue(null);
    const onResume = jest.fn();

    await renderHook(() => useResumeActiveGame(onResume));
    await act(async () => {});

    expect(onResume).not.toHaveBeenCalled();
  });

  it('waits for the session, then checks once per account', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeBootstrappingAuthSession(),
    );
    (getMyActiveGame as jest.Mock).mockResolvedValue(null);
    const { rerender } = await renderHook(() => useResumeActiveGame(jest.fn()));
    expect(getMyActiveGame).not.toHaveBeenCalled();

    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { id: 'guest-1' } }),
    );
    await rerender({});
    await rerender({});
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { id: 'account-2' } }),
    );
    await rerender({});
    await act(async () => {});

    expect(getMyActiveGame).toHaveBeenCalledTimes(2);
  });
});

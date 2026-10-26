import { act, renderHook } from '@testing-library/react-native';
import { Share } from 'react-native';

import { useGameShare } from '../useGameShare';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getGamePgn } from '../../network/restClient';
import { SHARE_FAILED_MESSAGE } from '../../constants/errorMessages';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  getGamePgn: jest.fn(),
}));

const PGN = '[Event "Casual"]\n\n1. e4 e5 *';

describe('useGameShare', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue({
      isReady: true,
      accessToken: 'token-123',
      userId: 'u',
      socket: {},
    });
    jest.spyOn(Share, 'share').mockResolvedValue({
      action: 'sharedAction',
      activityType: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("fetches the game's PGN and opens the share sheet with it", async () => {
    (getGamePgn as jest.Mock).mockResolvedValue(PGN);
    const { result } = await renderHook(() => useGameShare('game-1'));

    await act(() => result.current());

    expect(getGamePgn).toHaveBeenCalledWith('game-1', 'token-123');
    expect(Share.share).toHaveBeenCalledWith({ message: PGN });
  });

  it('reports a failure instead of sharing when the PGN request fails', async () => {
    (getGamePgn as jest.Mock).mockRejectedValue(new Error('500'));
    const onError = jest.fn();
    const { result } = await renderHook(() => useGameShare('game-1', onError));

    await act(() => result.current());

    expect(Share.share).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(SHARE_FAILED_MESSAGE);
  });

  it('reports a failure when there is no session yet', async () => {
    (useAuthSession as jest.Mock).mockReturnValue({ isReady: false });
    const onError = jest.fn();
    const { result } = await renderHook(() => useGameShare('game-1', onError));

    await act(() => result.current());

    expect(getGamePgn).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(SHARE_FAILED_MESSAGE);
  });
});

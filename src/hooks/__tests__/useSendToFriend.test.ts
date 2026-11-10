import { act, renderHook } from '@testing-library/react-native';

import { useSendToFriend } from '../useSendToFriend';
import { MESSAGE_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useOptionalSocialContext } from '../../context/SocialContext';
import { ApiError, sendMessage } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeFriend, makeSocial } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../context/SocialContext', () => ({
  useOptionalSocialContext: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  sendMessage: jest.fn(),
}));

const FRIEND = makeFriend();

describe('useSendToFriend', () => {
  const onMessage = jest.fn();

  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (useOptionalSocialContext as jest.Mock).mockReturnValue(
      makeSocial({ friends: [FRIEND] }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends what was picked to the friend chosen, and says so', async () => {
    (sendMessage as jest.Mock).mockResolvedValue({});
    const { result } = await renderHook(() => useSendToFriend(onMessage));
    expect(result.current.isAvailable).toBe(true);

    await act(() => result.current.open({ kind: 'game', gameId: 'game-1' }));
    expect(result.current.pending).toEqual({ kind: 'game', gameId: 'game-1' });
    await act(() => result.current.sendTo(FRIEND));

    expect(sendMessage).toHaveBeenCalledWith(
      FRIEND.username,
      { text: '', attachment: { kind: 'game', gameId: 'game-1' } },
      'access-token',
    );
    expect(onMessage).toHaveBeenCalledWith(`Sent to ${FRIEND.displayName}`);
    expect(result.current.pending).toBeNull();
  });

  it("says why it couldn't be sent", async () => {
    (sendMessage as jest.Mock)
      .mockRejectedValueOnce(new ApiError(403, 'You can only message friends'))
      .mockRejectedValueOnce(new ApiError(0, 'Network Error'));
    const { result } = await renderHook(() => useSendToFriend(onMessage));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await act(() => result.current.open({ kind: 'position', fen: 'x' }));
      await act(() => result.current.sendTo(FRIEND));
    }

    expect(onMessage.mock.calls).toEqual([
      ['You can only message friends'],
      [MESSAGE_FAILED_MESSAGE],
    ]);
  });

  it('has nobody to send to with no friends, or no social state', async () => {
    (useOptionalSocialContext as jest.Mock).mockReturnValue(
      makeSocial({ friends: [] }),
    );
    const noFriends = await renderHook(() => useSendToFriend());
    expect(noFriends.result.current.isAvailable).toBe(false);

    (useOptionalSocialContext as jest.Mock).mockReturnValue(null);
    const noSocial = await renderHook(() => useSendToFriend());
    expect(noSocial.result.current.isAvailable).toBe(false);
  });
});

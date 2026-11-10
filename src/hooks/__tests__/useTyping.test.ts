import { act, renderHook } from '@testing-library/react-native';

import {
  TYPING_SEND_EVERY_MS,
  TYPING_SHOWN_FOR_MS,
  useSendTyping,
  useTypingFriends,
} from '../useTyping';
import { useAuthSession } from '../../context/AuthSessionContext';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeDirectMessage } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

describe('useTyping', () => {
  let fake: FakeSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { id: 'user-1' }, socket: fake.socket }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('useTypingFriends', () => {
    it('shows a friend typing until they stop saying so', async () => {
      const { result } = await renderHook(() => useTypingFriends());

      await act(() => fake.trigger('dm:typing', { userId: 'ana' }));
      expect(result.current.has('ana')).toBe(true);

      await act(() => jest.advanceTimersByTime(TYPING_SHOWN_FOR_MS - 1000));
      await act(() => fake.trigger('dm:typing', { userId: 'ana' }));
      await act(() => jest.advanceTimersByTime(TYPING_SHOWN_FOR_MS - 1000));
      expect(result.current.has('ana')).toBe(true);

      await act(() => jest.advanceTimersByTime(1000));
      expect(result.current.has('ana')).toBe(false);
    });

    it('stops showing them typing once their message comes', async () => {
      const { result } = await renderHook(() => useTypingFriends());

      await act(() => fake.trigger('dm:typing', { userId: 'ana' }));
      await act(() =>
        fake.trigger('dm:message', makeDirectMessage({ senderId: 'ana' })),
      );

      expect(result.current.has('ana')).toBe(false);
    });
  });

  describe('useSendTyping', () => {
    it('tells the friend at most once every few seconds, and not for a cleared draft', async () => {
      const { result } = await renderHook(() => useSendTyping('ana'));

      await act(() => result.current('h'));
      await act(() => result.current('hi'));
      await act(() => result.current('   '));
      expect(fake.socket.emit).toHaveBeenCalledTimes(1);
      expect(fake.socket.emit).toHaveBeenCalledWith('dm:typing', {
        userId: 'ana',
      });

      await act(() => jest.advanceTimersByTime(TYPING_SEND_EVERY_MS));
      await act(() => result.current('hi!'));
      expect(fake.socket.emit).toHaveBeenCalledTimes(2);
    });
  });
});

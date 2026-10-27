import { act, renderHook } from '@testing-library/react-native';

import { useGameChat } from '../useGameChat';
import { ChatMessage } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';

const GAME_ID = 'game-1';
const ME = 'me';
const OPPONENT = 'opponent';

function message(id: string, userId: string, text = 'hi'): ChatMessage {
  return {
    id,
    gameId: GAME_ID,
    userId,
    text,
    createdAt: '2026-10-27T10:00:00.000Z',
  };
}

describe('useGameChat', () => {
  it('asks for the history once listening, and again after a reconnect', async () => {
    const { socket, trigger } = createFakeSocket();
    await renderHook(() => useGameChat(socket, GAME_ID, ME, false));

    expect(socket.emit).toHaveBeenCalledWith('game:chatHistory', {
      gameId: GAME_ID,
    });

    await act(() => trigger('connect', undefined));

    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it('shows the history and then new messages, once each', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() =>
      useGameChat(socket, GAME_ID, ME, true),
    );

    await act(() =>
      trigger('game:chatHistory', {
        gameId: GAME_ID,
        messages: [message('1', OPPONENT)],
      }),
    );
    await act(() => trigger('game:chat', message('2', ME)));
    await act(() => trigger('game:chat', message('2', ME)));
    await act(() =>
      trigger('game:chat', { ...message('3', OPPONENT), gameId: 'other' }),
    );

    expect(result.current.messages.map((m) => m.id)).toEqual(['1', '2']);
  });

  it("counts the opponent's messages while closed, and clears on opening", async () => {
    const { socket, trigger } = createFakeSocket();
    const { result, rerender } = await renderHook(
      (isOpen: boolean) => useGameChat(socket, GAME_ID, ME, isOpen),
      { initialProps: false },
    );

    await act(() => trigger('game:chat', message('1', OPPONENT)));
    await act(() => trigger('game:chat', message('2', ME)));
    await act(() => trigger('game:chat', message('3', OPPONENT)));
    expect(result.current.unreadCount).toBe(2);

    await rerender(true);
    expect(result.current.unreadCount).toBe(0);

    await act(() => trigger('game:chat', message('4', OPPONENT)));
    expect(result.current.unreadCount).toBe(0);
  });

  it('sends trimmed text, and nothing for blank text', async () => {
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() =>
      useGameChat(socket, GAME_ID, ME, true),
    );

    await act(() => result.current.send('   '));
    await act(() => result.current.send('  good game  '));

    expect(socket.emit).toHaveBeenLastCalledWith('game:chat', {
      gameId: GAME_ID,
      text: 'good game',
    });
    expect(
      (socket.emit as jest.Mock).mock.calls.filter(
        ([event]) => event === 'game:chat',
      ),
    ).toHaveLength(1);
  });
});

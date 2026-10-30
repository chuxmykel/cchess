import { act, renderHook } from '@testing-library/react-native';

import { useFollowPlayer } from '../useFollowPlayer';
import { createFakeSocket } from '../../testUtils/fakeSocket';

const PLAYER_ID = 'player-1';

describe('useFollowPlayer', () => {
  it('follows the player, and hands over each game of theirs that starts', async () => {
    const { socket, trigger } = createFakeSocket();
    const onGameStarted = jest.fn();
    await renderHook(() => useFollowPlayer(socket, PLAYER_ID, onGameStarted));

    expect(socket.emit).toHaveBeenCalledWith('user:follow', {
      userId: PLAYER_ID,
    });

    await act(() => {
      trigger('user:gameStarted', { userId: PLAYER_ID, gameId: 'game-2' });
    });
    expect(onGameStarted).toHaveBeenCalledWith('game-2');
  });

  it("ignores another player's game", async () => {
    const { socket, trigger } = createFakeSocket();
    const onGameStarted = jest.fn();
    await renderHook(() => useFollowPlayer(socket, PLAYER_ID, onGameStarted));

    await act(() => {
      trigger('user:gameStarted', { userId: 'someone-else', gameId: 'g' });
    });

    expect(onGameStarted).not.toHaveBeenCalled();
  });

  it('follows again after a reconnect, and stops once unmounted', async () => {
    const { socket, trigger } = createFakeSocket();
    const { unmount } = await renderHook(() =>
      useFollowPlayer(socket, PLAYER_ID, jest.fn()),
    );
    jest.mocked(socket.emit).mockClear();

    await act(() => trigger('connect', undefined));
    expect(socket.emit).toHaveBeenCalledWith('user:follow', {
      userId: PLAYER_ID,
    });

    await act(() => unmount());
    expect(socket.emit).toHaveBeenCalledWith('user:unfollow', {
      userId: PLAYER_ID,
    });
  });

  it('follows no one without a player', async () => {
    const { socket } = createFakeSocket();
    await renderHook(() => useFollowPlayer(socket, null, jest.fn()));

    expect(socket.emit).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from '@testing-library/react-native';

import { useOpponentPresence } from '../useOpponentPresence';
import { createFakeSocket } from '../../testUtils/fakeSocket';

describe('useOpponentPresence', () => {
  it('assumes the opponent is online until told otherwise', async () => {
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() =>
      useOpponentPresence(socket, 'game-1', 'opponent'),
    );

    expect(result.current).toBe(true);
  });

  it("follows the server's word on the opponent", async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() =>
      useOpponentPresence(socket, 'game-1', 'opponent'),
    );

    await act(() =>
      trigger('game:presence', {
        gameId: 'game-1',
        userId: 'opponent',
        online: false,
      }),
    );
    expect(result.current).toBe(false);

    await act(() =>
      trigger('game:presence', {
        gameId: 'game-1',
        userId: 'opponent',
        online: true,
      }),
    );
    expect(result.current).toBe(true);
  });

  it('ignores news about other players and games', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() =>
      useOpponentPresence(socket, 'game-1', 'opponent'),
    );

    await act(() =>
      trigger('game:presence', {
        gameId: 'game-1',
        userId: 'me',
        online: false,
      }),
    );
    await act(() =>
      trigger('game:presence', {
        gameId: 'game-2',
        userId: 'opponent',
        online: false,
      }),
    );

    expect(result.current).toBe(true);
  });
});

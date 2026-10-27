import { act, renderHook } from '@testing-library/react-native';

import { GAME_SNAPSHOT_STATUS, useGameSnapshot } from '../useGameSnapshot';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

const GAME_ID = 'game-1';

describe('useGameSnapshot', () => {
  it('reports loading when given no socket', async () => {
    const { result } = await renderHook(() => useGameSnapshot(null, GAME_ID));

    expect(result.current).toEqual({ status: GAME_SNAPSHOT_STATUS.LOADING });
  });

  it('joins the game room on mount', async () => {
    const { socket } = createFakeSocket();
    await renderHook(() => useGameSnapshot(socket, GAME_ID));

    expect(socket.emit).toHaveBeenCalledWith('game:join', {
      gameId: GAME_ID,
    });
  });

  it('joins again after the socket reconnects', async () => {
    const { socket, trigger } = createFakeSocket();
    await renderHook(() => useGameSnapshot(socket, GAME_ID));

    await act(() => trigger('connect', undefined));

    expect(
      (socket.emit as jest.Mock).mock.calls.filter(
        ([event]) => event === 'game:join',
      ),
    ).toHaveLength(2);
  });

  it('becomes ready once game:state arrives for this game', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useGameSnapshot(socket, GAME_ID));

    expect(result.current.status).toBe(GAME_SNAPSHOT_STATUS.LOADING);

    const snapshot = makeGameSnapshot({ id: GAME_ID });
    await act(() => {
      trigger('game:state', snapshot);
    });

    expect(result.current).toEqual({
      status: GAME_SNAPSHOT_STATUS.READY,
      snapshot,
    });
  });

  it('ignores a game:state for a different game id', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useGameSnapshot(socket, GAME_ID));

    await act(() => {
      trigger('game:state', makeGameSnapshot({ id: 'some-other-game' }));
    });

    expect(result.current.status).toBe(GAME_SNAPSHOT_STATUS.LOADING);
  });

  it("doesn't join anything while there's no game yet", async () => {
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() => useGameSnapshot(socket, null));

    expect(socket.emit).not.toHaveBeenCalled();
    expect(result.current.status).toBe(GAME_SNAPSHOT_STATUS.LOADING);
  });

  it("goes back to loading for a new game rather than reporting the last game's snapshot", async () => {
    const { socket, trigger } = createFakeSocket();
    const { result, rerender } = await renderHook(
      (gameId: string) => useGameSnapshot(socket, gameId),
      { initialProps: 'game-1' },
    );
    await act(() => {
      trigger('game:state', makeGameSnapshot({ id: 'game-1' }));
    });
    expect(result.current.status).toBe(GAME_SNAPSHOT_STATUS.READY);

    await rerender('game-2');

    expect(result.current.status).toBe(GAME_SNAPSHOT_STATUS.LOADING);
    expect(socket.emit).toHaveBeenLastCalledWith('game:join', {
      gameId: 'game-2',
    });

    await act(() => {
      trigger('game:state', makeGameSnapshot({ id: 'game-2' }));
    });
    expect(result.current).toEqual({
      status: GAME_SNAPSHOT_STATUS.READY,
      snapshot: makeGameSnapshot({ id: 'game-2' }),
    });
  });
});

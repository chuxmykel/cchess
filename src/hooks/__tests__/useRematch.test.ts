import { act, renderHook } from '@testing-library/react-native';

import { useRematch } from '../useRematch';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

describe('useRematch', () => {
  const finished = makeGameSnapshot({
    id: 'game-1',
    status: 'completed',
    result: 'white',
  });

  async function renderRematch(
    snapshot = finished,
    onRematchStarted = jest.fn(),
  ) {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() =>
      useRematch(socket, snapshot, 'w', onRematchStarted),
    );
    return { result, socket, trigger, onRematchStarted };
  }

  it('offers and declines a rematch of this game', async () => {
    const { result, socket } = await renderRematch();

    result.current.offer();
    result.current.decline();

    expect(socket.emit).toHaveBeenCalledWith('game:rematchOffer', {
      gameId: 'game-1',
    });
    expect(socket.emit).toHaveBeenCalledWith('game:rematchDecline', {
      gameId: 'game-1',
    });
  });

  it('follows offers made by either side', async () => {
    const { result, trigger } = await renderRematch();
    expect(result.current.status).toBe('none');

    await act(async () =>
      trigger('game:rematchOffered', { gameId: 'game-1', by: 'black' }),
    );
    expect(result.current.status).toBe('received');

    await act(async () =>
      trigger('game:rematchDeclined', { gameId: 'game-1', by: 'white' }),
    );
    expect(result.current.status).toBe('none');

    await act(async () =>
      trigger('game:rematchOffered', { gameId: 'game-1', by: 'white' }),
    );
    expect(result.current.status).toBe('offered');
  });

  it('says so when the opponent turns down our offer', async () => {
    const { result, trigger } = await renderRematch();
    await act(async () =>
      trigger('game:rematchOffered', { gameId: 'game-1', by: 'white' }),
    );

    await act(async () =>
      trigger('game:rematchDeclined', { gameId: 'game-1', by: 'black' }),
    );

    expect(result.current.status).toBe('declined');
  });

  it('starts from an offer already made when the game loads', async () => {
    const { result } = await renderRematch(
      makeGameSnapshot({ ...finished, rematchOfferedBy: 'black' }),
    );

    expect(result.current.status).toBe('received');
  });

  it('hands over the rematch once the server starts it', async () => {
    const { trigger, onRematchStarted } = await renderRematch();

    await act(async () => {
      trigger('game:created', makeGameSnapshot({ id: 'other-game' }));
      trigger(
        'game:created',
        makeGameSnapshot({ id: 'game-2', rematchOfId: 'game-1' }),
      );
    });

    expect(onRematchStarted).toHaveBeenCalledTimes(1);
    expect(onRematchStarted).toHaveBeenCalledWith('game-2');
  });

  it('ignores offers about other games', async () => {
    const { result, trigger } = await renderRematch();

    await act(async () =>
      trigger('game:rematchOffered', { gameId: 'game-9', by: 'black' }),
    );

    expect(result.current.status).toBe('none');
  });
});

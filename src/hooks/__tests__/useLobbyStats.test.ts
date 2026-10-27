import { act, renderHook } from '@testing-library/react-native';

import { useLobbyStats } from '../useLobbyStats';
import { createFakeSocket } from '../../testUtils/fakeSocket';

const STATS = { playersOnline: 12, gamesInPlay: 4 };

describe('useLobbyStats', () => {
  it('has no stats until the server sends some', async () => {
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() => useLobbyStats(socket, true));

    expect(result.current).toBeNull();
  });

  it('keeps the latest stats while seeking', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useLobbyStats(socket, true));

    await act(() => trigger('lobby:stats', STATS));
    expect(result.current).toEqual(STATS);

    await act(() =>
      trigger('lobby:stats', { playersOnline: 13, gamesInPlay: 5 }),
    );
    expect(result.current).toEqual({ playersOnline: 13, gamesInPlay: 5 });
  });

  it('ignores stats and forgets them once no longer seeking', async () => {
    const { socket, trigger } = createFakeSocket();
    const { result, rerender } = await renderHook(
      (isSeeking: boolean) => useLobbyStats(socket, isSeeking),
      { initialProps: true },
    );
    await act(() => trigger('lobby:stats', STATS));

    await rerender(false);
    await act(() => trigger('lobby:stats', STATS));

    expect(result.current).toBeNull();
  });
});

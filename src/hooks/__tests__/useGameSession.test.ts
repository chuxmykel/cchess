import { act, renderHook } from '@testing-library/react-native';

import { useGameSession } from '../useGameSession';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';

describe('useGameSession', () => {
  it('starts seeking when given a time control', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ timeControl: DEFAULT_TIME_CONTROL }),
    );

    expect(result.current.session).toEqual({
      phase: 'seeking',
      timeControl: DEFAULT_TIME_CONTROL,
    });
  });

  it('starts playing when given a game', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ gameId: 'game-1' }),
    );

    expect(result.current.session).toEqual({
      phase: 'playing',
      gameId: 'game-1',
    });
  });

  it('moves into the matched game, and back to seeking for a new opponent', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ timeControl: DEFAULT_TIME_CONTROL }),
    );

    await act(() => result.current.startGame('game-1'));
    expect(result.current.session).toEqual({
      phase: 'playing',
      gameId: 'game-1',
      timeControl: DEFAULT_TIME_CONTROL,
    });

    await act(() => result.current.seekNewOpponent(DEFAULT_TIME_CONTROL));
    expect(result.current.session).toEqual({
      phase: 'seeking',
      timeControl: DEFAULT_TIME_CONTROL,
    });
  });
});

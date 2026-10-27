import { act, renderHook } from '@testing-library/react-native';

import { useGameSession } from '../useGameSession';
import { DEFAULT_RATING_RANGE, Seek } from '../../constants/seek';
import {
  DEFAULT_TIME_CONTROL,
  findTimeControl,
} from '../../constants/timeControls';

const CASUAL_SEEK: Seek = {
  timeControl: DEFAULT_TIME_CONTROL,
  rated: false,
  ratingRange: { below: 100, above: 300 },
};

describe('useGameSession', () => {
  it('starts seeking when given a seek', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ seek: CASUAL_SEEK }),
    );

    expect(result.current.session).toEqual({
      phase: 'seeking',
      seek: CASUAL_SEEK,
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
      useGameSession({ seek: CASUAL_SEEK }),
    );

    await act(() => result.current.startGame('game-1'));
    expect(result.current.session).toEqual({
      phase: 'playing',
      gameId: 'game-1',
      seek: CASUAL_SEEK,
    });

    await act(() => result.current.seekNewOpponent(DEFAULT_TIME_CONTROL));
    expect(result.current.session).toEqual({
      phase: 'seeking',
      seek: CASUAL_SEEK,
    });
  });

  it('keeps the rated choice and range when seeking a new time control', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ seek: CASUAL_SEEK }),
    );
    const rapid = findTimeControl(10, 0, 'rapid');

    await act(() => result.current.startGame('game-1'));
    await act(() => result.current.seekNewOpponent(rapid));

    expect(result.current.session).toEqual({
      phase: 'seeking',
      seek: { ...CASUAL_SEEK, timeControl: rapid },
    });
  });

  it('seeks a rated game with the default range after a game it was given', async () => {
    const { result } = await renderHook(() =>
      useGameSession({ gameId: 'game-1' }),
    );

    await act(() => result.current.seekNewOpponent(DEFAULT_TIME_CONTROL));

    expect(result.current.session).toEqual({
      phase: 'seeking',
      seek: {
        timeControl: DEFAULT_TIME_CONTROL,
        rated: true,
        ratingRange: DEFAULT_RATING_RANGE,
      },
    });
  });
});

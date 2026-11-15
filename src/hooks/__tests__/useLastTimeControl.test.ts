import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { useLastTimeControl } from '../useLastTimeControl';
import {
  DEFAULT_TIME_CONTROL,
  TIME_CONTROL_GROUPS,
} from '../../constants/timeControls';

const BULLET_1_0 = TIME_CONTROL_GROUPS[0].options[0];

describe('useLastTimeControl', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the default when nothing is saved', async () => {
    const { result } = await renderHook(() => useLastTimeControl());
    await act(async () => {});

    expect(result.current[0]).toBe(DEFAULT_TIME_CONTROL);
  });

  it('saves each choice, and loads it next time', async () => {
    const first = await renderHook(() => useLastTimeControl());
    await act(async () => first.result.current[1](BULLET_1_0));

    const again = await renderHook(() => useLastTimeControl());
    await act(async () => {});

    expect(again.result.current[0]).toBe(BULLET_1_0);
  });

  it('keeps a choice made before the saved one loads', async () => {
    let finishLoading: (saved: string) => void = () => {};
    jest.spyOn(AsyncStorage, 'getItem').mockReturnValueOnce(
      new Promise((resolve) => {
        finishLoading = resolve;
      }),
    );
    const { result } = await renderHook(() => useLastTimeControl());
    const chosen = TIME_CONTROL_GROUPS[2].options[0];
    await act(async () => result.current[1](chosen));
    await act(async () =>
      finishLoading(
        JSON.stringify({ initialSeconds: 60, incrementSeconds: 0 }),
      ),
    );

    expect(result.current[0]).toBe(chosen);
  });

  it('falls back to the default for one no longer offered', async () => {
    await AsyncStorage.setItem(
      'cchess.lastTimeControl',
      JSON.stringify({ initialSeconds: 7, incrementSeconds: 99 }),
    );
    const { result } = await renderHook(() => useLastTimeControl());
    await act(async () => {});

    expect(result.current[0]).toBe(DEFAULT_TIME_CONTROL);
  });
});

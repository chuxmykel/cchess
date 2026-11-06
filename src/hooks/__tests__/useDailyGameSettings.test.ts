import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { useDailyGameSettings } from '../useDailyGameSettings';
import { DEFAULT_DAILY_GAME_SETTINGS } from '../../constants/dailyGame';

describe('useDailyGameSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the defaults when nothing is saved', async () => {
    const { result } = await renderHook(() => useDailyGameSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_DAILY_GAME_SETTINGS);
  });

  it('saves each change, and loads it next time', async () => {
    const first = await renderHook(() => useDailyGameSettings());
    await act(async () => first.result.current.update({ confirmMoves: true }));

    const again = await renderHook(() => useDailyGameSettings());
    await act(async () => {});

    expect(again.result.current.settings).toEqual({ confirmMoves: true });
  });

  it('falls back to the default for a value it can not read', async () => {
    await AsyncStorage.setItem(
      'cchess.dailyGameSettings',
      JSON.stringify({ confirmMoves: 'yes' }),
    );
    const { result } = await renderHook(() => useDailyGameSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_DAILY_GAME_SETTINGS);
  });
});

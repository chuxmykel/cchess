import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { useAppearanceSettings } from '../useAppearanceSettings';
import { DEFAULT_APPEARANCE_SETTINGS } from '../../constants/appearance';

describe('useAppearanceSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the defaults when nothing is saved', async () => {
    const { result } = await renderHook(() => useAppearanceSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_APPEARANCE_SETTINGS);
  });

  it('saves each change, and loads it next time', async () => {
    const first = await renderHook(() => useAppearanceSettings());
    await act(async () =>
      first.result.current.update({
        colorScheme: 'dark',
        boardTheme: 'lichess.org',
      }),
    );

    const again = await renderHook(() => useAppearanceSettings());
    await act(async () => {});

    expect(again.result.current.settings).toEqual({
      colorScheme: 'dark',
      boardTheme: 'lichess.org',
      pieceSet: 'standard',
    });
  });

  it('falls back to the default for a value no longer offered', async () => {
    await AsyncStorage.setItem(
      'cchess.appearanceSettings',
      JSON.stringify({
        colorScheme: 'sepia',
        boardTheme: 'toString',
        pieceSet: 'cardboard',
      }),
    );
    const { result } = await renderHook(() => useAppearanceSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_APPEARANCE_SETTINGS);
  });
});

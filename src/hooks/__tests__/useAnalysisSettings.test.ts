import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { useAnalysisSettings } from '../useAnalysisSettings';
import { DEFAULT_ANALYSIS_SETTINGS } from '../../constants/analysis';

describe('useAnalysisSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the defaults when nothing is saved', async () => {
    const { result } = await renderHook(() => useAnalysisSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_ANALYSIS_SETTINGS);
  });

  it('saves each change, and loads it next time', async () => {
    const first = await renderHook(() => useAnalysisSettings());
    await act(async () => first.result.current.update({ threatArrows: true }));

    const again = await renderHook(() => useAnalysisSettings());
    await act(async () => {});

    expect(again.result.current.settings).toEqual({
      ...DEFAULT_ANALYSIS_SETTINGS,
      threatArrows: true,
    });
  });

  it('gives a setting added since it was saved its default', async () => {
    await AsyncStorage.setItem(
      'cchess.analysisSettings',
      JSON.stringify({ evalBar: false }),
    );
    const { result } = await renderHook(() => useAnalysisSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual({
      ...DEFAULT_ANALYSIS_SETTINGS,
      evalBar: false,
    });
  });

  it('carries over settings saved before lines had a count and search had a time', async () => {
    await AsyncStorage.setItem(
      'cchess.analysisSettings',
      JSON.stringify({ engineLines: false, depth: 24, sounds: false }),
    );
    const { result } = await renderHook(() => useAnalysisSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual({
      ...DEFAULT_ANALYSIS_SETTINGS,
      engineLineCount: 0,
      sounds: false,
    });
  });
});

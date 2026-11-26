import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { DEFAULT_REVIEW_SETTINGS } from '../../constants/review';
import { useReviewSettings } from '../useReviewSettings';

describe('useReviewSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the defaults when nothing is saved', async () => {
    const { result } = await renderHook(() => useReviewSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_REVIEW_SETTINGS);
  });

  it('saves each change, and loads it next time', async () => {
    const first = await renderHook(() => useReviewSettings());
    await act(async () =>
      first.result.current.update({ voice: false, strength: 'deep' }),
    );

    const again = await renderHook(() => useReviewSettings());
    await act(async () => {});

    expect(again.result.current.settings).toEqual({
      ...DEFAULT_REVIEW_SETTINGS,
      voice: false,
      strength: 'deep',
    });
  });

  it('opens in the cchess style, and keeps Classic once chosen', async () => {
    const first = await renderHook(() => useReviewSettings());
    await act(async () => {});
    expect(first.result.current.settings.style).toBe('cchess');

    await act(async () => first.result.current.update({ style: 'classic' }));
    const again = await renderHook(() => useReviewSettings());
    await act(async () => {});

    expect(again.result.current.settings.style).toBe('classic');
  });

  it('falls back to the default for a value it can not read', async () => {
    await AsyncStorage.setItem(
      'cchess.reviewSettings',
      JSON.stringify({
        voice: 'yes',
        strength: 'ludicrous',
        reviewAs: 'w',
        style: 'fancy',
      }),
    );
    const { result } = await renderHook(() => useReviewSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual(DEFAULT_REVIEW_SETTINGS);
  });
});

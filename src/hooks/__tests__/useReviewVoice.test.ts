import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';

import { useReviewVoice, useSpeechVoices } from '../useReviewVoice';

describe('useReviewVoice', () => {
  afterEach(() => jest.clearAllMocks());

  it('lists the English voices, the most natural first', async () => {
    const { result } = await renderHook(() => useSpeechVoices());
    await act(async () => {});

    expect(result.current?.map((v) => v.name)).toEqual(['Daniel', 'Samantha']);
  });

  it('says a comment in the best voice there is, stopping the last', async () => {
    const { result } = await renderHook(() => useReviewVoice(true, null));
    await act(async () => {});

    await act(async () => result.current.say('e4 is a book move.'));

    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(
      'e4 is a book move.',
      expect.objectContaining({
        voice: 'com.apple.voice.enhanced.en-GB.Daniel',
        language: 'en-GB',
      }),
    );
  });

  it('says it in the voice chosen', async () => {
    const { result } = await renderHook(() =>
      useReviewVoice(true, 'com.apple.voice.compact.en-US.Samantha'),
    );
    await act(async () => {});

    await act(async () => result.current.say('Nf3 is best.'));

    expect(Speech.speak).toHaveBeenCalledWith(
      'Nf3 is best.',
      expect.objectContaining({
        voice: 'com.apple.voice.compact.en-US.Samantha',
      }),
    );
  });

  it('says nothing while turned off, and stops when turned off', async () => {
    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useReviewVoice(enabled, null),
      { initialProps: { enabled: true } },
    );
    await act(async () => {});
    (Speech.stop as jest.Mock).mockClear();

    await rerender({ enabled: false });
    expect(Speech.stop).toHaveBeenCalled();

    await act(async () => result.current.say('Bg3 is a mistake.'));
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('stops talking when the screen closes', async () => {
    const { unmount } = await renderHook(() => useReviewVoice(true, null));
    await act(async () => {});
    (Speech.stop as jest.Mock).mockClear();

    await unmount();
    expect(Speech.stop).toHaveBeenCalled();
  });
});

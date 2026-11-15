import { act, renderHook } from '@testing-library/react-native';

import { REVIEW_PLAY_STEP_MS } from '../../constants/review';
import { useAnalysisPlayback } from '../useAnalysisPlayback';

describe('useAnalysisPlayback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function step(times = 1) {
    for (let i = 0; i < times; i++) {
      await act(async () => jest.advanceTimersByTime(REVIEW_PLAY_STEP_MS));
    }
  }

  it('plays the moves a step at a time, up to those analysed', async () => {
    const { result, rerender } = await renderHook(
      ({ analysed }: { analysed: number }) => useAnalysisPlayback(analysed),
      { initialProps: { analysed: 0 } },
    );
    expect(result.current).toBe(0);
    await step(3);
    expect(result.current).toBe(0);

    await rerender({ analysed: 3 });
    await step();
    expect(result.current).toBe(1);
    await step(5);
    // No further than the analysis has got.
    expect(result.current).toBe(3);

    await rerender({ analysed: 10 });
    await step(2);
    expect(result.current).toBe(5);
  });
});

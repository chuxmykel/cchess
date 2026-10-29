import { renderHook } from '@testing-library/react-native';

import { useDragGuide } from '../useDragGuide';

describe('useDragGuide', () => {
  it('starts hidden at the origin', async () => {
    const { result } = await renderHook(() => useDragGuide());

    expect(result.current.opacity.get()).toBe(0);
    expect(result.current.x.get()).toBe(0);
    expect(result.current.y.get()).toBe(0);
  });

  it('returns the same guide across re-renders - every piece is given it', async () => {
    const { result, rerender } = await renderHook(() => useDragGuide());
    const first = result.current;

    await rerender({});

    expect(result.current).toBe(first);
  });
});

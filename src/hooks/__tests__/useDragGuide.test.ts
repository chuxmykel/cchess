import { renderHook } from '@testing-library/react-native';

import { useDragGuide } from '../useDragGuide';

describe('useDragGuide', () => {
  it('starts hidden at the origin', async () => {
    const { result } = await renderHook(() => useDragGuide());

    expect(result.current.opacity.get()).toBe(0);
    expect(result.current.x.get()).toBe(0);
    expect(result.current.y.get()).toBe(0);
  });

  it('keeps the same shared values across re-renders', async () => {
    const { result, rerender } = await renderHook(() => useDragGuide());
    const first = result.current;

    await rerender({});

    expect(result.current.x).toBe(first.x);
    expect(result.current.y).toBe(first.y);
    expect(result.current.opacity).toBe(first.opacity);
  });
});

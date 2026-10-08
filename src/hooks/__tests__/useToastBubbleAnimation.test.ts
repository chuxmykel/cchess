import { renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { useToastBubbleAnimation } from '../useToastBubbleAnimation';
import { getAnimatedValue } from '../../testUtils/animatedValue';

describe('useToastBubbleAnimation', () => {
  it('starts invisible and offset downward, before any animation runs', async () => {
    const { result } = await renderHook(() => useToastBubbleAnimation());

    expect(getAnimatedValue(result.current.opacity)).toBe(0);
    expect(getAnimatedValue(result.current.translateY)).toBe(12);
  });

  it('animates opacity to 1 and translateY to 0 on mount', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');

    await renderHook(() => useToastBubbleAnimation());

    expect(timingSpy).toHaveBeenCalledWith(
      expect.objectContaining({ __getValue: expect.any(Function) }),
      expect.objectContaining({
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    );
    expect(timingSpy).toHaveBeenCalledWith(
      expect.objectContaining({ __getValue: expect.any(Function) }),
      expect.objectContaining({
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    );

    timingSpy.mockRestore();
  });

  it('runs both animations together via Animated.parallel, not one after another', async () => {
    const parallelSpy = jest.spyOn(Animated, 'parallel');

    await renderHook(() => useToastBubbleAnimation());

    expect(parallelSpy).toHaveBeenCalledTimes(1);
    expect(parallelSpy.mock.calls[0][0]).toHaveLength(2);

    parallelSpy.mockRestore();
  });

  it('returns the same Animated.Value instances across re-renders', async () => {
    const { result, rerender } = await renderHook(() =>
      useToastBubbleAnimation(),
    );

    const firstOpacity = result.current.opacity;
    const firstTranslateY = result.current.translateY;
    await rerender(undefined);

    expect(result.current.opacity).toBe(firstOpacity);
    expect(result.current.translateY).toBe(firstTranslateY);
  });
});

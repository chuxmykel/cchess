import { act, renderHook } from "@testing-library/react-native";
import { Animated } from "react-native";

import { useCaretRotation } from "../useCaretRotation";

function getInterpolatedValue(interpolation: { __getValue(): string | number }) {
  return interpolation.__getValue();
}

describe("useCaretRotation", () => {
  it("starts unrotated and fully opaque when closed", async () => {
    const { result } = await renderHook(() => useCaretRotation(false));

    expect(getInterpolatedValue(result.current.rotateTransform.transform[0].rotate as any)).toBe(
      "0deg",
    );
    expect(getInterpolatedValue(result.current.pulseDipOpacity.opacity as any)).toBe(1);
  });

  it("animates the underlying progress toward 1 when opened, and back to 0 when closed again", async () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { rerender } = await renderHook((open: boolean) => useCaretRotation(open), {
      initialProps: false,
    });

    await act(async () => {
      rerender(true);
    });
    expect(timingSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1 }),
    );

    await act(async () => {
      rerender(false);
    });
    expect(timingSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0 }),
    );

    timingSpy.mockRestore();
  });

  it("rotates a full 180deg once the underlying progress reaches 1", async () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { result, rerender } = await renderHook((open: boolean) => useCaretRotation(open), {
      initialProps: false,
    });

    await act(async () => {
      rerender(true);
    });
    const progress = timingSpy.mock.calls[timingSpy.mock.calls.length - 1][0] as Animated.Value;
    await act(async () => {
      progress.setValue(1);
    });

    expect(getInterpolatedValue(result.current.rotateTransform.transform[0].rotate as any)).toBe(
      "180deg",
    );
    expect(getInterpolatedValue(result.current.pulseDipOpacity.opacity as any)).toBe(1);

    timingSpy.mockRestore();
  });

  it("dips the opacity at the midpoint of the rotation instead of fading linearly", async () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { result, rerender } = await renderHook((open: boolean) => useCaretRotation(open), {
      initialProps: false,
    });

    await act(async () => {
      rerender(true);
    });
    const progress = timingSpy.mock.calls[timingSpy.mock.calls.length - 1][0] as Animated.Value;
    await act(async () => {
      progress.setValue(0.5);
    });

    expect(getInterpolatedValue(result.current.pulseDipOpacity.opacity as any)).toBeCloseTo(0.4);

    timingSpy.mockRestore();
  });
});

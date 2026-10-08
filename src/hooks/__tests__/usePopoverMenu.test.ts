jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 400, height: 800, scale: 1, fontScale: 1 }),
}));

import { act, renderHook } from "@testing-library/react-native";

import { usePopoverMenu } from "../usePopoverMenu";

const MENU_WIDTH = 160;

function fakeTrigger(x: number, y: number, width: number, height: number) {
  return {
    measureInWindow: (
      callback: (x: number, y: number, width: number, height: number) => void,
    ) => callback(x, y, width, height),
  } as any;
}

describe("usePopoverMenu", () => {
  it("starts closed with no position", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));

    expect(result.current.visible).toBe(false);
    expect(result.current.position).toBeNull();
  });

  it("open anchors the menu below the trigger's right edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(300, 100, 20, 20);

    await act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.position).toEqual({ top: 124, left: 160 });
  });

  it("clamps the menu so it doesn't overflow the window's right edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    // Naive left (380 + 20 - 160 = 240) would overflow a 400-wide window.
    result.current.triggerRef.current = fakeTrigger(380, 100, 20, 20);

    await act(() => {
      result.current.open();
    });

    expect(result.current.position?.left).toBe(232);
  });

  it("clamps the menu so it doesn't overflow the window's left edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    // Naive left (0 + 20 - 160 = -140) would go off-screen.
    result.current.triggerRef.current = fakeTrigger(0, 100, 20, 20);

    await act(() => {
      result.current.open();
    });

    expect(result.current.position?.left).toBe(8);
  });

  it("close hides the menu but keeps its last position", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(300, 100, 20, 20);

    await act(() => {
      result.current.open();
    });
    const openPosition = result.current.position;

    await act(() => {
      result.current.close();
    });

    expect(result.current.visible).toBe(false);
    expect(result.current.position).toEqual(openPosition);
  });
});

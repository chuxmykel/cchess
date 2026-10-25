import { act, renderHook } from '@testing-library/react-native';

import {
  usePopoverMenu,
  SCREEN_EDGE_MARGIN,
  RIGHT_PLACEMENT_GAP,
  BELOW_PLACEMENT_GAP,
} from '../usePopoverMenu';

// Must match the width literal in the useWindowDimensions mock below - the
// mock factory is hoisted above this declaration, so it can't reference this
// constant directly (babel-plugin-jest-hoist only allows referencing
// out-of-scope identifiers prefixed with "mock").
const WINDOW_WIDTH = 400;

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({
    width: 400,
    height: 800,
    scale: 1,
    fontScale: 1,
  }),
}));

const MENU_WIDTH = 160;
const MENU_HEIGHT = 40;

const TRIGGER_WIDTH = 20;
const TRIGGER_HEIGHT = 20;

// A trigger positioned with enough room on every side that no clamping
// kicks in - the baseline case for asserting the un-clamped anchor math.
const TRIGGER_X = 300;
const TRIGGER_Y = 100;

// Positioned so the menu's naive (unclamped) left would land past the
// window's right edge: TRIGGER_NEAR_RIGHT_EDGE_X + TRIGGER_WIDTH - MENU_WIDTH
// = 380 + 20 - 160 = 240, which overflows a 400-wide window.
const TRIGGER_NEAR_RIGHT_EDGE_X = 380;

// Positioned so the menu's naive (unclamped) left would go negative:
// TRIGGER_NEAR_LEFT_EDGE_X + TRIGGER_WIDTH - MENU_WIDTH = 0 + 20 - 160 = -140.
const TRIGGER_NEAR_LEFT_EDGE_X = 0;

const RIGHT_PLACEMENT_TRIGGER_X = 100;
const RIGHT_PLACEMENT_TRIGGER_Y = 200;

function fakeTrigger(x: number, y: number, width: number, height: number) {
  return {
    measureInWindow: (
      callback: (x: number, y: number, width: number, height: number) => void,
    ) => callback(x, y, width, height),
  } as any;
}

describe('usePopoverMenu', () => {
  it('starts closed with no position', async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));

    expect(result.current.visible).toBe(false);
    expect(result.current.position).toBeNull();
  });

  it("open anchors the menu below the trigger's right edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(
      TRIGGER_X,
      TRIGGER_Y,
      TRIGGER_WIDTH,
      TRIGGER_HEIGHT,
    );

    await act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.position).toEqual({
      top: TRIGGER_Y + TRIGGER_HEIGHT + BELOW_PLACEMENT_GAP,
      left: TRIGGER_X + TRIGGER_WIDTH - MENU_WIDTH,
    });
  });

  it("clamps the menu so it doesn't overflow the window's right edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(
      TRIGGER_NEAR_RIGHT_EDGE_X,
      TRIGGER_Y,
      TRIGGER_WIDTH,
      TRIGGER_HEIGHT,
    );

    await act(() => {
      result.current.open();
    });

    expect(result.current.position?.left).toBe(
      WINDOW_WIDTH - MENU_WIDTH - SCREEN_EDGE_MARGIN,
    );
  });

  it("clamps the menu so it doesn't overflow the window's left edge", async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(
      TRIGGER_NEAR_LEFT_EDGE_X,
      TRIGGER_Y,
      TRIGGER_WIDTH,
      TRIGGER_HEIGHT,
    );

    await act(() => {
      result.current.open();
    });

    expect(result.current.position?.left).toBe(SCREEN_EDGE_MARGIN);
  });

  it('close hides the menu but keeps its last position', async () => {
    const { result } = await renderHook(() => usePopoverMenu(MENU_WIDTH));
    result.current.triggerRef.current = fakeTrigger(
      TRIGGER_X,
      TRIGGER_Y,
      TRIGGER_WIDTH,
      TRIGGER_HEIGHT,
    );

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

  describe("placement: 'right'", () => {
    it("anchors to the trigger's right edge, vertically centered using menuHeight", async () => {
      const { result } = await renderHook(() =>
        usePopoverMenu(MENU_WIDTH, {
          placement: 'right',
          menuHeight: MENU_HEIGHT,
        }),
      );
      result.current.triggerRef.current = fakeTrigger(
        RIGHT_PLACEMENT_TRIGGER_X,
        RIGHT_PLACEMENT_TRIGGER_Y,
        TRIGGER_WIDTH,
        TRIGGER_HEIGHT,
      );

      await act(() => {
        result.current.open();
      });

      expect(result.current.position).toEqual({
        left: RIGHT_PLACEMENT_TRIGGER_X + TRIGGER_WIDTH + RIGHT_PLACEMENT_GAP,
        top: RIGHT_PLACEMENT_TRIGGER_Y + TRIGGER_HEIGHT / 2 - MENU_HEIGHT / 2,
      });
    });

    it("clamps so it doesn't overflow the window's right edge", async () => {
      const { result } = await renderHook(() =>
        usePopoverMenu(MENU_WIDTH, {
          placement: 'right',
          menuHeight: MENU_HEIGHT,
        }),
      );
      result.current.triggerRef.current = fakeTrigger(
        TRIGGER_NEAR_RIGHT_EDGE_X,
        TRIGGER_Y,
        TRIGGER_WIDTH,
        TRIGGER_HEIGHT,
      );

      await act(() => {
        result.current.open();
      });

      expect(result.current.position?.left).toBe(
        WINDOW_WIDTH - MENU_WIDTH - SCREEN_EDGE_MARGIN,
      );
    });
  });
});

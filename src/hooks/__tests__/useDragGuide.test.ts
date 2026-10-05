import { act, renderHook } from "@testing-library/react-native";

import { useDragGuide } from "../useDragGuide";
import { getAnimatedValue } from "../../testUtils/animatedValue";

describe("useDragGuide", () => {
  const pieceWidth = 50;

  it("starts hidden at the origin", async () => {
    const { result } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    expect(getAnimatedValue(result.current.opacity)).toBe(0);
    expect(getAnimatedValue(result.current.position.x)).toBe(0);
    expect(getAnimatedValue(result.current.position.y)).toBe(0);
  });

  it("show makes the guide visible", async () => {
    const { result } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    await act(() => {
      result.current.show();
    });

    expect(getAnimatedValue(result.current.opacity)).toBe(1);
  });

  it("hide only touches opacity, leaving position wherever it last was", async () => {
    const { result } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    await act(() => {
      result.current.updatePosition({ x: 100, y: 150 });
    });
    await act(() => {
      result.current.hide();
    });

    expect(getAnimatedValue(result.current.opacity)).toBe(0);
    expect(getAnimatedValue(result.current.position.x)).toBe(100);
    expect(getAnimatedValue(result.current.position.y)).toBe(150);
  });

  it("updatePosition moves the guide and shows it for an on-board square", async () => {
    const { result } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    await act(() => {
      result.current.updatePosition({ x: 100, y: 150 });
    });

    expect(getAnimatedValue(result.current.position.x)).toBe(100);
    expect(getAnimatedValue(result.current.position.y)).toBe(150);
    expect(getAnimatedValue(result.current.opacity)).toBe(1);
  });

  it("updatePosition hides the guide without moving it once dragged off the board", async () => {
    const { result } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    await act(() => {
      result.current.updatePosition({ x: 100, y: 150 });
    });
    await act(() => {
      // Well past the last file/rank at this width - off the board.
      result.current.updatePosition({ x: 500, y: 500 });
    });

    expect(getAnimatedValue(result.current.opacity)).toBe(0);
    expect(getAnimatedValue(result.current.position.x)).toBe(100);
    expect(getAnimatedValue(result.current.position.y)).toBe(150);
  });

  it("keeps show, hide and updatePosition referentially stable across a re-render with the same pieceWidth", async () => {
    const { result, rerender } = await renderHook(
      (props: { pieceWidth: number }) => useDragGuide(props.pieceWidth),
      { initialProps: { pieceWidth } },
    );

    const { show, hide, updatePosition } = result.current;
    await rerender({ pieceWidth });

    expect(result.current.show).toBe(show);
    expect(result.current.hide).toBe(hide);
    expect(result.current.updatePosition).toBe(updatePosition);
  });
});

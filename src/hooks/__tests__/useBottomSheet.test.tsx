import { act, render, renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { useBottomSheet, BottomSheetAnimation } from '../useBottomSheet';
import { getAnimatedValue } from '../../testUtils/animatedValue';
import {
  simulatePanResponderDrag,
  simulatePanResponderGrantAndMove,
} from '../../testUtils/panResponderGesture';

// A minimal host component so the hook's panHandlers can be driven through
// fireEvent-based gesture simulation.
// renderHook alone has no host node to attach a PanResponder to. The hook's result is
// mirrored onto resultRef so assertions outside the tree can read it.
function Harness({
  visible,
  onClose,
  resultRef,
}: {
  visible: boolean;
  onClose: () => void;
  resultRef: { current: BottomSheetAnimation | null };
}) {
  const hookResult = useBottomSheet({ visible, onClose });
  // Test-only mirror of the hook's result onto a ref so assertions
  // outside the render tree can read it; not production code subject to
  // the compiler.
  // eslint-disable-next-line react-hooks/refs
  resultRef.current = hookResult;

  return (
    <Animated.View
      testID="sheet-handle"
      style={{ transform: [{ translateY: hookResult.translateY }] }}
      {...hookResult.panHandlers}
    />
  );
}

// Mounts the harness and lets any timer-driven animation triggered on mount
// (the open/close animation driven by the initial `visible` value) finish,
// so a gesture simulated afterward isn't racing an in-flight completion
// callback.
async function mountHarness(visible: boolean, onClose: () => void) {
  const resultRef: { current: BottomSheetAnimation | null } = { current: null };
  const screen = await render(
    <Harness visible={visible} onClose={onClose} resultRef={resultRef} />,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  return { screen, resultRef };
}

describe('useBottomSheet', () => {
  it('modalVisible matches an initially-true visible prop', async () => {
    const { result } = await renderHook(() =>
      useBottomSheet({ visible: true, onClose: jest.fn() }),
    );

    expect(result.current.modalVisible).toBe(true);
  });

  it('modalVisible becomes true once visible flips to true', async () => {
    const { result, rerender } = await renderHook(
      (props: { visible: boolean }) =>
        useBottomSheet({ visible: props.visible, onClose: jest.fn() }),
      { initialProps: { visible: false } },
    );
    expect(result.current.modalVisible).toBe(false);

    await act(async () => {
      rerender({ visible: true });
    });

    expect(result.current.modalVisible).toBe(true);
  });

  it('keeps modalVisible true until the close animation finishes, so the sheet stays mounted mid-exit', async () => {
    const { result, rerender } = await renderHook(
      (props: { visible: boolean }) =>
        useBottomSheet({ visible: props.visible, onClose: jest.fn() }),
      { initialProps: { visible: true } },
    );

    await act(async () => {
      rerender({ visible: false });
    });
    expect(result.current.modalVisible).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(result.current.modalVisible).toBe(false);
  });

  it('follows the finger while dragging down from the handle', async () => {
    const { screen, resultRef } = await mountHarness(true, jest.fn());
    const target = screen.getByTestId('sheet-handle');

    await simulatePanResponderGrantAndMove(target, 0, 60);

    expect(getAnimatedValue(resultRef.current!.translateY)).toBe(60);
  });

  it('ignores upward movement - the sheet only tracks dragging down', async () => {
    const { screen, resultRef } = await mountHarness(true, jest.fn());
    const target = screen.getByTestId('sheet-handle');
    const valueBeforeDrag = getAnimatedValue(resultRef.current!.translateY);

    await simulatePanResponderGrantAndMove(target, 0, -60);

    expect(getAnimatedValue(resultRef.current!.translateY)).toBe(
      valueBeforeDrag,
    );
  });

  it('springs back without closing when released short of the drag-close distance', async () => {
    const onClose = jest.fn();
    const { screen } = await mountHarness(true, onClose);
    const target = screen.getByTestId('sheet-handle');

    await simulatePanResponderDrag(target, 0, 60);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes once dragged past the drag-close distance', async () => {
    const onClose = jest.fn();
    const { screen } = await mountHarness(true, onClose);
    const target = screen.getByTestId('sheet-handle');

    await act(async () => {
      await simulatePanResponderDrag(target, 0, 150);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

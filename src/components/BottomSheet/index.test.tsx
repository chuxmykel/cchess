import { act, fireEvent, render } from '@testing-library/react-native';
import { Dimensions, Keyboard, Text } from 'react-native';

import BottomSheet from '.';
import { captureKeyboardListeners } from '../../testUtils/keyboard';
import { withSafeArea } from '../../testUtils/safeArea';

describe('BottomSheet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders its children while visible', async () => {
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={jest.fn()}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );

    expect(screen.getByText('Sheet content')).toBeTruthy();
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={onClose}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );

    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fits its content, up to 75% of the screen', async () => {
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={jest.fn()}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );

    expect(screen.getByTestId('bottom-sheet')).toHaveStyle({
      maxHeight: '75%',
    });
  });

  it('takes a share of the screen above the keyboard, running on behind it', async () => {
    jest.useFakeTimers();
    const keyboard = captureKeyboardListeners();
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={jest.fn()} heightRatio={0.8}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );
    const { height: windowHeight } = Dimensions.get('window');
    expect(screen.getByTestId('bottom-sheet-frame')).toHaveStyle({
      bottom: 0,
      height: windowHeight * 0.8,
    });

    await act(() => {
      keyboard.show(300);
      jest.advanceTimersByTime(500);
    });

    // 80% of what's above the keyboard shows; the keyboard covers the rest.
    expect(screen.getByTestId('bottom-sheet-frame')).toHaveStyle({
      bottom: 0,
      height: (windowHeight - 300) * 0.8 + 300,
    });
    jest.useRealTimers();
  });

  it('closes the keyboard when it closes, but not when it mounts closed', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const sheet = (visible: boolean) =>
      withSafeArea(
        <BottomSheet visible={visible} onClose={jest.fn()} heightRatio={0.8}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      );
    const screen = await render(sheet(false));
    expect(dismiss).not.toHaveBeenCalled();

    await screen.rerender(sheet(true));
    await screen.rerender(sheet(false));

    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("forgets a keyboard that left with the sheet's modal without saying so", async () => {
    jest.useFakeTimers();
    const keyboard = captureKeyboardListeners();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const sheet = (visible: boolean) =>
      withSafeArea(
        <BottomSheet visible={visible} onClose={jest.fn()} heightRatio={0.8}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      );
    const screen = await render(sheet(true));
    await act(() => {
      keyboard.show(300);
      jest.advanceTimersByTime(500);
    });

    await screen.rerender(sheet(false));
    await screen.rerender(sheet(true));

    const { height: windowHeight } = Dimensions.get('window');
    expect(screen.getByTestId('bottom-sheet-frame')).toHaveStyle({
      height: windowHeight * 0.8,
    });
    jest.useRealTimers();
  });
});

import { act, fireEvent, render } from '@testing-library/react-native';

import GameToolbar from '.';
import { REPEAT_INTERVAL_MS } from '../../hooks/usePressAndHoldRepeat';

describe('GameToolbar', () => {
  function renderToolbar(
    overrides: Partial<Parameters<typeof GameToolbar>[0]> = {},
  ) {
    const props = {
      onOpenMenu: jest.fn(),
      onResign: jest.fn(),
      canResign: true,
      onOpenChat: jest.fn(),
      unreadChatCount: 0,
      onPreviousMove: jest.fn(),
      onNextMove: jest.fn(),
      canGoToPreviousMove: true,
      canGoToNextMove: true,
      ...overrides,
    };
    return { props, screenPromise: render(<GameToolbar {...props} />) };
  }

  it('wires each button to its handler', async () => {
    const { props, screenPromise } = renderToolbar();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId('toolbar-resign-button'));
    await fireEvent.press(screen.getByTestId('chat-button'));
    await fireEvent.press(screen.getByTestId('previous-move-button'));
    await fireEvent.press(screen.getByTestId('next-move-button'));

    expect(props.onOpenMenu).toHaveBeenCalledTimes(1);
    expect(props.onResign).toHaveBeenCalledTimes(1);
    expect(props.onOpenChat).toHaveBeenCalledTimes(1);
    expect(props.onPreviousMove).toHaveBeenCalledTimes(1);
    expect(props.onNextMove).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['previous-move-button', 'onPreviousMove'],
    ['next-move-button', 'onNextMove'],
  ] as const)(
    'keeps stepping through the moves while %s is held',
    async (testID, handler) => {
      jest.useFakeTimers();
      try {
        const { props, screenPromise } = renderToolbar();
        const screen = await screenPromise;
        const button = screen.getByTestId(testID);

        await fireEvent(button, 'longPress');
        await act(() => jest.advanceTimersByTime(2 * REPEAT_INTERVAL_MS));
        await fireEvent(button, 'pressOut');
        await act(() => jest.advanceTimersByTime(2 * REPEAT_INTERVAL_MS));

        expect(props[handler]).toHaveBeenCalledTimes(3);
      } finally {
        jest.useRealTimers();
      }
    },
  );

  it('disables resign while it is not offered', async () => {
    const { props, screenPromise } = renderToolbar({ canResign: false });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('toolbar-resign-button'));

    expect(props.onResign).not.toHaveBeenCalled();
    expect(screen.getByTestId('toolbar-resign-button')).toBeDisabled();
  });

  it('disables move navigation at either end of the move list', async () => {
    const { props, screenPromise } = renderToolbar({
      canGoToPreviousMove: false,
      canGoToNextMove: false,
    });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('previous-move-button'));
    await fireEvent.press(screen.getByTestId('next-move-button'));

    expect(props.onPreviousMove).not.toHaveBeenCalled();
    expect(props.onNextMove).not.toHaveBeenCalled();
  });

  describe('chat badge', () => {
    it('shows how many chat messages are unread', async () => {
      const { screenPromise } = renderToolbar({ unreadChatCount: 3 });
      const screen = await screenPromise;

      expect(screen.getByTestId('chat-button-badge')).toHaveTextContent('3');
      expect(screen.getByLabelText('Chat, 3 unread')).toBeTruthy();
    });

    it('caps the count at 9+', async () => {
      const { screenPromise } = renderToolbar({ unreadChatCount: 12 });
      const screen = await screenPromise;

      expect(screen.getByTestId('chat-button-badge')).toHaveTextContent('9+');
    });

    it('has no badge with nothing unread', async () => {
      const { screenPromise } = renderToolbar();
      const screen = await screenPromise;

      expect(screen.queryByTestId('chat-button-badge')).toBeNull();
    });
  });

  it('leaves out resign and chat when they have no handler', async () => {
    const { screenPromise } = renderToolbar({
      onResign: undefined,
      onOpenChat: undefined,
    });
    const screen = await screenPromise;

    expect(screen.queryByTestId('toolbar-resign-button')).toBeNull();
    expect(screen.queryByTestId('chat-button')).toBeNull();
    expect(screen.getByTestId('previous-move-button')).toBeTruthy();
  });
});

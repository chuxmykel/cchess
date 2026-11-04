import { act, fireEvent, render, within } from '@testing-library/react-native';

import * as Haptics from 'expo-haptics';

import GameToolbar, { MoveSteps, ToolbarButton } from '.';
import { REPEAT_INTERVAL_MS } from '../../hooks/usePressAndHoldRepeat';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('GameToolbar', () => {
  beforeEach(() => jest.mocked(Haptics.impactAsync).mockClear());

  type Overrides = Partial<
    Omit<Parameters<typeof GameToolbar>[0], 'moveSteps'>
  > & { moveSteps?: Partial<MoveSteps> };

  function renderToolbar(overrides: Overrides = {}) {
    const props = {
      onOpenMenu: jest.fn(),
      onResign: jest.fn(),
      canResign: true,
      onOpenChat: jest.fn(),
      unreadChatCount: 0,
      ...overrides,
      moveSteps: {
        back: jest.fn(),
        forward: jest.fn(),
        canGoBack: true,
        canGoForward: true,
        ...overrides.moveSteps,
      },
    };
    return { props, screenPromise: render(<GameToolbar {...props} />) };
  }

  it('wires each button to its handler', async () => {
    const { props, screenPromise } = renderToolbar();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId('toolbar-resign-button'));
    await fireEvent.press(screen.getByTestId('chat-button'));
    await fireEvent(screen.getByTestId('previous-move-button'), 'pressIn');
    await fireEvent(screen.getByTestId('next-move-button'), 'pressIn');

    expect(props.onOpenMenu).toHaveBeenCalledTimes(1);
    expect(props.onResign).toHaveBeenCalledTimes(1);
    expect(props.onOpenChat).toHaveBeenCalledTimes(1);
    expect(props.moveSteps.back).toHaveBeenCalledTimes(1);
    expect(props.moveSteps.forward).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['previous-move-button', 'back'],
    ['next-move-button', 'forward'],
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

        expect(props.moveSteps[handler]).toHaveBeenCalledTimes(3);
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
      moveSteps: { canGoBack: false, canGoForward: false },
    });
    const screen = await screenPromise;

    await fireEvent(screen.getByTestId('previous-move-button'), 'pressIn');
    await fireEvent(screen.getByTestId('next-move-button'), 'pressIn');

    expect(props.moveSteps.back).not.toHaveBeenCalled();
    expect(props.moveSteps.forward).not.toHaveBeenCalled();
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

  describe('tooltips', () => {
    it("shows what a button does while it's held, without pressing it", async () => {
      const { props, screenPromise } = renderToolbar();
      const screen = await screenPromise;
      const menu = screen.getByTestId('game-menu-button');

      await fireEvent(menu, 'longPress');

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light,
      );
      expect(
        within(
          screen.getByTestId('toolbar-tooltip', {
            includeHiddenElements: true,
          }),
        ).getByText('Menu', { includeHiddenElements: true }),
      ).toBeTruthy();

      await fireEvent(menu, 'pressOut');

      expect(
        screen.queryByTestId('toolbar-tooltip', {
          includeHiddenElements: true,
        }),
      ).toBeNull();
      expect(props.onOpenMenu).not.toHaveBeenCalled();
    });

    it('explains the button with its hint, when it has one', async () => {
      const screen = await render(
        <ToolbarButton
          icon="magnify-scan"
          label="Analyse"
          hint="Analyse this position"
          onPress={jest.fn()}
          testID="analyse"
        />,
      );

      await fireEvent(screen.getByTestId('analyse'), 'longPress');

      expect(
        screen.getByText('Analyse this position', {
          includeHiddenElements: true,
        }),
      ).toBeTruthy();
    });

    it('has none for the buttons that repeat while held', async () => {
      const { screenPromise } = renderToolbar();
      const screen = await screenPromise;

      await fireEvent(screen.getByTestId('previous-move-button'), 'longPress');
      await fireEvent(screen.getByTestId('next-move-button'), 'longPress');

      expect(
        screen.queryByTestId('toolbar-tooltip', {
          includeHiddenElements: true,
        }),
      ).toBeNull();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });
});

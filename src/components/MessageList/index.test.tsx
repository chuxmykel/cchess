import { fireEvent, render, within } from '@testing-library/react-native';

import MessageList from '.';
import { ShownMessage } from '../../hooks/useDirectMessages';
import { useGameSummary } from '../../hooks/useGameSummary';
import { makeDirectMessage } from '../../testUtils/social';

jest.mock('../../hooks/useGameSummary', () => ({
  useGameSummary: jest.fn(),
}));

// Local times, as a phone shows them.
const NOW = new Date(2026, 8, 28, 18, 0);
function at(day: number, hour: number, minute = 0) {
  return new Date(2026, 8, day, hour, minute).toISOString();
}
function shown(overrides: Partial<ShownMessage> = {}): ShownMessage {
  return { ...makeDirectMessage(overrides), delivery: 'sent', ...overrides };
}

async function renderList(
  messages: ShownMessage[],
  props: Partial<React.ComponentProps<typeof MessageList>> = {},
) {
  return render(
    <MessageList
      otherName="Judit"
      messages={messages}
      myUserId="user-1"
      hasOlder={false}
      onLoadOlder={jest.fn()}
      now={NOW}
      {...props}
    />,
  );
}

describe('MessageList', () => {
  beforeEach(() => {
    (useGameSummary as jest.Mock).mockReturnValue(null);
  });

  it('separates the days, and tells mine from theirs', async () => {
    const screen = await renderList([
      shown({ id: 'a', text: 'Playyyy!!', createdAt: at(27, 11, 37) }),
      shown({
        id: 'b',
        senderId: 'user-1',
        text: 'Sure',
        createdAt: at(28, 15, 39),
      }),
    ]);

    expect(screen.getByText('Yesterday')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByTestId('message-b')).toHaveStyle({
      alignSelf: 'flex-end',
    });
    expect(screen.getByTestId('message-a')).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });

  it('shows the time once, under the last of a run of messages', async () => {
    const screen = await renderList([
      shown({ id: 'a', text: 'one', createdAt: at(28, 9, 0) }),
      shown({ id: 'b', text: 'two', createdAt: at(28, 9, 1) }),
    ]);

    expect(
      within(screen.getByTestId('message-a')).queryByText('09:00'),
    ).toBeNull();
    expect(
      within(screen.getByTestId('message-b')).getByText('09:01'),
    ).toBeTruthy();
  });

  it('says my newest message was seen once they have read it', async () => {
    const mine = shown({
      id: 'mine',
      senderId: 'user-1',
      createdAt: at(28, 9, 0),
    });

    const unseen = await renderList([mine], { theirLastReadAt: null });
    expect(unseen.queryByTestId('message-mine-seen')).toBeNull();

    const seen = await renderList([mine], { theirLastReadAt: at(28, 9, 5) });
    expect(seen.getByTestId('message-mine-seen')).toHaveTextContent('Seen');
  });

  it('draws a message of only emoji large, without a bubble', async () => {
    const screen = await renderList([shown({ id: 'e', text: '👍' })]);

    expect(screen.getByText('👍')).toHaveStyle({ fontSize: 44 });
  });

  it('shows one of mine still on its way, and one that failed to retry', async () => {
    const onRetry = jest.fn();
    const screen = await renderList(
      [
        shown({ id: 'pending-1', senderId: 'user-1', delivery: 'sending' }),
        shown({ id: 'pending-2', senderId: 'user-1', delivery: 'failed' }),
      ],
      { onRetry },
    );

    expect(screen.getByText('Sending…')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('message-pending-2-retry'));
    expect(onRetry).toHaveBeenCalledWith('pending-2');
  });

  it('shows them typing', async () => {
    const screen = await renderList([], { isTyping: true });

    expect(screen.getByTestId('typing-indicator')).toBeTruthy();
    expect(screen.queryByTestId('messages-empty')).toBeNull();
  });

  it('draws a shared game or position as a card that opens it', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const onOpenGame = jest.fn();
    const onOpenPosition = jest.fn();
    const screen = await renderList(
      [
        shown({
          id: 'g',
          text: '',
          attachment: { kind: 'game', gameId: 'game-1' },
        }),
        shown({
          id: 'p',
          text: 'what now?',
          attachment: { kind: 'position', fen },
        }),
      ],
      { onOpenGame, onOpenPosition },
    );

    await fireEvent.press(screen.getByTestId('message-g-attachment'));
    await fireEvent.press(screen.getByTestId('message-p-attachment'));

    expect(onOpenGame).toHaveBeenCalledWith('game-1');
    expect(onOpenPosition).toHaveBeenCalledWith(fen);
    expect(screen.getByText('Black to move · Tap to analyse')).toBeTruthy();
    expect(screen.getByText('what now?')).toBeTruthy();
  });

  it('invites a first message to the friend', async () => {
    const screen = await renderList([]);

    expect(screen.getByTestId('messages-empty')).toHaveTextContent(
      /Say hello to Judit!/,
    );
  });

  it('loads earlier messages when there are more', async () => {
    const onLoadOlder = jest.fn();
    const screen = await renderList([], { hasOlder: true, onLoadOlder });

    await fireEvent.press(screen.getByTestId('load-older-messages'));

    expect(onLoadOlder).toHaveBeenCalled();
  });
});

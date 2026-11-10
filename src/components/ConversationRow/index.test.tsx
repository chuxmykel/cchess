import { fireEvent, render } from '@testing-library/react-native';

import ConversationRow, { previewOf } from '.';
import { ConversationSummary } from '../../network/restClient';
import { makeDirectMessage } from '../../testUtils/social';

const NOW = new Date(2026, 9, 27, 18, 0);
const SENT_AT = new Date(2026, 9, 27, 14, 5).toISOString();

function conversation(
  overrides: Partial<ConversationSummary> = {},
  message: Parameters<typeof makeDirectMessage>[0] = {},
): ConversationSummary {
  return {
    user: {
      id: 'ana',
      username: 'ana',
      displayName: 'Ana',
      avatarColor: '#123456',
    },
    lastMessage: makeDirectMessage({
      senderId: 'ana',
      text: 'Good game!',
      createdAt: SENT_AT,
      ...message,
    }),
    unreadCount: 0,
    theirLastReadAt: null,
    ...overrides,
  };
}

async function renderRow(
  props: Partial<React.ComponentProps<typeof ConversationRow>> = {},
) {
  const onPress = jest.fn();
  const onLongPress = jest.fn();
  const screen = await render(
    <ConversationRow
      conversation={conversation()}
      myUserId="user-1"
      unreadCount={0}
      presence={null}
      isTyping={false}
      now={NOW}
      onPress={onPress}
      onLongPress={onLongPress}
      {...props}
    />,
  );
  return { screen, onPress, onLongPress };
}

describe('ConversationRow', () => {
  it('shows who, their last message and when', async () => {
    const { screen } = await renderRow();

    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('Good game!')).toBeTruthy();
    expect(screen.getByText('14:05')).toBeTruthy();
  });

  it('counts the unread', async () => {
    const { screen } = await renderRow({ unreadCount: 3 });

    expect(screen.getByTestId('conversation-ana-unread')).toHaveTextContent(
      '3',
    );
  });

  it('says when they are typing, in place of the last message', async () => {
    const { screen } = await renderRow({ isTyping: true });

    expect(screen.getByTestId('conversation-ana-typing')).toHaveTextContent(
      'typing…',
    );
    expect(screen.queryByText('Good game!')).toBeNull();
  });

  it('marks my last message sent, then seen once they have read it', async () => {
    const mine = { senderId: 'user-1' };
    const sent = await renderRow({ conversation: conversation({}, mine) });
    expect(sent.screen.getByTestId('conversation-ana-sent')).toBeTruthy();

    const seen = await renderRow({
      conversation: conversation({ theirLastReadAt: SENT_AT }, mine),
    });
    expect(seen.screen.getByTestId('conversation-ana-seen')).toBeTruthy();
  });

  it('opens the conversation, or its menu on a long press', async () => {
    const { screen, onPress, onLongPress } = await renderRow();

    await fireEvent.press(screen.getByTestId('conversation-ana'));
    await fireEvent(screen.getByTestId('conversation-ana'), 'longPress');

    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({ unreadCount: 0 }),
    );
    expect(onLongPress).toHaveBeenCalled();
  });
});

describe('previewOf', () => {
  it("marks mine, and says what was shared when there's no text", () => {
    expect(previewOf(conversation({}, { senderId: 'user-1' }), 'user-1')).toBe(
      'You: Good game!',
    );
    expect(
      previewOf(
        conversation(
          {},
          { text: '', attachment: { kind: 'game', gameId: 'g' } },
        ),
        'user-1',
      ),
    ).toBe('Shared a game');
    expect(
      previewOf(
        conversation(
          {},
          {
            senderId: 'user-1',
            text: '',
            attachment: { kind: 'position', fen: 'x' },
          },
        ),
        'user-1',
      ),
    ).toBe('You: Shared a position');
  });
});

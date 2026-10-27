import { fireEvent, render } from '@testing-library/react-native';

import ChatSheet from '.';
import { ChatMessage } from '../../network/socketEvents';
import { withSafeArea } from '../../testUtils/safeArea';

function message(id: string, userId: string, text: string): ChatMessage {
  return {
    id,
    gameId: 'game-1',
    userId,
    text,
    createdAt: '2026-10-27T10:00:00.000Z',
  };
}

describe('ChatSheet', () => {
  function renderSheet(messages: ChatMessage[] = [], onSend = jest.fn()) {
    return render(
      withSafeArea(
        <ChatSheet
          visible
          onClose={jest.fn()}
          messages={messages}
          myUserId="me"
          onSend={onSend}
        />,
      ),
    );
  }

  it('invites the first message when there are none', async () => {
    const screen = await renderSheet();

    expect(screen.getByText('No messages yet. Say hello!')).toBeTruthy();
  });

  it('puts your messages on the right and theirs on the left', async () => {
    const screen = await renderSheet([
      message('1', 'opponent', 'good luck'),
      message('2', 'me', 'you too'),
    ]);

    expect(screen.getByTestId('chat-message-1')).toHaveStyle({
      alignSelf: 'flex-start',
    });
    expect(screen.getByTestId('chat-message-2')).toHaveStyle({
      alignSelf: 'flex-end',
    });
  });

  it('sends the draft and clears it', async () => {
    const onSend = jest.fn();
    const screen = await renderSheet([], onSend);

    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('chat-input'), 'gg');
    await fireEvent.press(screen.getByTestId('chat-send-button'));

    expect(onSend).toHaveBeenCalledWith('gg');
    expect(screen.getByTestId('chat-input').props.value).toBe('');
  });

  it('limits a message to 140 characters', async () => {
    const screen = await renderSheet();

    expect(screen.getByTestId('chat-input').props.maxLength).toBe(140);
  });
});

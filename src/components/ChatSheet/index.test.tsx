import { fireEvent, render } from '@testing-library/react-native';

import ChatSheet from '.';
import { ChatMessage } from '../../network/socketEvents';
import { withSafeArea } from '../../testUtils/safeArea';

function message(id: string, userId: string, text: string): ChatMessage {
  return {
    id,
    gameId: 'game-1',
    userId,
    kind: 'message',
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
          playerNames={{ me: 'Me', them: 'Judit' }}
          onSend={onSend}
        />,
      ),
    );
  }

  it('invites the first message when there are none', async () => {
    const screen = await renderSheet();

    expect(screen.getByTestId('chat-empty')).toBeTruthy();
    expect(screen.getByText('Say hello to your opponent!')).toBeTruthy();
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

  it('shows notes of draws as plain lines naming who, not bubbles', async () => {
    const screen = await renderSheet([
      message('1', 'them', 'Good luck'),
      { ...message('2', 'them', ''), kind: 'draw-offered' },
      { ...message('3', 'me', ''), kind: 'draw-declined' },
      { ...message('4', 'them', ''), kind: 'draw-accepted' },
    ]);

    expect(screen.getByTestId('chat-notice-2')).toHaveTextContent(
      'Judit offered a draw',
    );
    expect(screen.getByTestId('chat-notice-3')).toHaveTextContent(
      'You declined the draw',
    );
    expect(screen.getByTestId('chat-notice-4')).toHaveTextContent(
      'Judit accepted the draw',
    );
    expect(screen.queryByTestId('chat-message-2')).toBeNull();
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

  it('shows the history but no way to send once the chat has closed', async () => {
    const screen = await render(
      withSafeArea(
        <ChatSheet
          visible
          onClose={jest.fn()}
          messages={[]}
          myUserId="me"
          playerNames={{}}
          onSend={jest.fn()}
          isClosed
        />,
      ),
    );

    expect(screen.getByTestId('chat-closed')).toBeTruthy();
    expect(screen.queryByTestId('chat-input')).toBeNull();
  });
});

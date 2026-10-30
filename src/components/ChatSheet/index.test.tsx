import { fireEvent, render } from '@testing-library/react-native';

import ChatSheet from '.';
import { GameChat } from '../../hooks/useGameChat';
import { ChatMessage, GameUserSummary } from '../../network/socketEvents';
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

function player(id: string, displayName: string): GameUserSummary {
  return {
    id,
    username: id,
    displayName,
    avatarColor: '#3b82f6',
    rating: 1500,
    provisional: false,
  };
}

function openChat(overrides: Partial<GameChat> = {}): GameChat {
  return {
    messages: [],
    unreadCount: 0,
    send: jest.fn(),
    myUserId: 'me',
    isOpen: true,
    isClosed: false,
    open: jest.fn(),
    close: jest.fn(),
    ...overrides,
  };
}

const PLAYERS = [player('me', 'Me'), player('them', 'Judit')];

describe('ChatSheet', () => {
  function renderSheet(messages: ChatMessage[] = [], send = jest.fn()) {
    return render(
      withSafeArea(
        <ChatSheet chat={openChat({ messages, send })} players={PLAYERS} />,
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
    const send = jest.fn();
    const screen = await renderSheet([], send);

    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('chat-input'), 'gg');
    await fireEvent.press(screen.getByTestId('chat-send-button'));

    expect(send).toHaveBeenCalledWith('gg');
    expect(screen.getByTestId('chat-input').props.value).toBe('');
  });

  it('limits a message to 140 characters', async () => {
    const screen = await renderSheet();

    expect(screen.getByTestId('chat-input').props.maxLength).toBe(140);
  });

  it('shows the history but no way to send once the chat has closed', async () => {
    const screen = await render(
      withSafeArea(
        <ChatSheet chat={openChat({ isClosed: true })} players={PLAYERS} />,
      ),
    );

    expect(screen.getByTestId('chat-closed')).toBeTruthy();
    expect(screen.queryByTestId('chat-input')).toBeNull();
  });
});

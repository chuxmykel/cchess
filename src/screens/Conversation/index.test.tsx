import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Conversation from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import {
  clearMessages,
  getMessages,
  markMessagesRead,
  sendMessage,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { withSafeArea } from '../../testUtils/safeArea';
import {
  makeDirectMessage,
  makeFriend,
  makeSocial,
} from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../context/SocialContext', () => ({
  useSocialContext: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  markMessagesRead: jest.fn(),
  clearMessages: jest.fn(),
}));

const FRIEND = makeFriend({ online: true });

describe('Conversation', () => {
  async function renderScreen() {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        user: { id: 'user-1', isGuest: false },
        socket: createFakeSocket().socket,
      }),
    );
    const social = makeSocial({ friends: [FRIEND] });
    (useSocialContext as jest.Mock).mockReturnValue(social);
    (getMessages as jest.Mock).mockResolvedValue([makeDirectMessage()]);
    (markMessagesRead as jest.Mock).mockResolvedValue(undefined);
    const navigation = { setOptions: jest.fn() };
    const screen = await render(
      withSafeArea(
        <Conversation
          navigation={navigation as never}
          route={{
            key: 'k',
            name: 'Conversation',
            params: {
              userId: FRIEND.id,
              username: FRIEND.username,
              displayName: FRIEND.displayName,
              avatarColor: FRIEND.avatarColor,
            },
          }}
        />,
      ),
    );
    await act(async () => {});
    return { screen, navigation, social };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the messages, the friend as online, and marks them read', async () => {
    const { screen, social } = await renderScreen();

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByTestId('conversation-presence')).toHaveTextContent(
      'Online',
    );
    expect(social.markConversationRead).toHaveBeenCalledWith(FRIEND.id);
  });

  it('sends a message', async () => {
    (sendMessage as jest.Mock).mockResolvedValue(
      makeDirectMessage({
        id: 'sent',
        senderId: 'user-1',
        recipientId: FRIEND.id,
        text: 'Rematch?',
        createdAt: '2026-10-27T11:00:00.000Z',
      }),
    );
    const { screen } = await renderScreen();

    await fireEvent.changeText(screen.getByTestId('message-input'), 'Rematch?');
    await fireEvent.press(screen.getByTestId('send-message-button'));

    expect(sendMessage).toHaveBeenCalledWith(
      FRIEND.username,
      'Rematch?',
      'access-token',
    );
    expect(screen.getByText('Rematch?')).toBeTruthy();
  });

  it('clears the conversation from the header once confirmed', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) =>
        buttons?.find((button) => button.style === 'destructive')?.onPress?.(),
      );
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { screen, navigation } = await renderScreen();
    const { headerRight } = (navigation.setOptions as jest.Mock).mock.calls.at(
      -1,
    )[0];
    const header = await render(headerRight());

    await fireEvent.press(header.getByTestId('clear-conversation-button'));
    await act(async () => {});

    expect(clearMessages).toHaveBeenCalledWith(FRIEND.username, 'access-token');
    expect(screen.queryByText('Hello')).toBeNull();
  });
});

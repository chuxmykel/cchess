import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Conversation from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import {
  ApiError,
  clearMessages,
  getMessages,
  getMyGames,
  getTheirLastReadAt,
  markMessagesRead,
  sendMessage,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSummary } from '../../testUtils/gameSummary';
import { waitForSheetToClose } from '../../testUtils/modal';
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
jest.mock('../../hooks/useGameSummary', () => ({
  useGameSummary: () => null,
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMessages: jest.fn(),
  getTheirLastReadAt: jest.fn(),
  getMyGames: jest.fn(),
  sendMessage: jest.fn(),
  markMessagesRead: jest.fn(),
  clearMessages: jest.fn(),
}));

const FRIEND = makeFriend({ online: true });

describe('Conversation', () => {
  let fake: FakeSocket;

  async function renderScreen(
    friend = FRIEND,
    messages = [makeDirectMessage()],
  ) {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        user: { id: 'user-1', isGuest: false },
        socket: fake.socket,
      }),
    );
    const social = makeSocial({ friends: [friend] });
    (useSocialContext as jest.Mock).mockReturnValue(social);
    (getMessages as jest.Mock).mockResolvedValue(messages);
    (getTheirLastReadAt as jest.Mock).mockResolvedValue(null);
    (markMessagesRead as jest.Mock).mockResolvedValue(undefined);
    const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
    const screen = await render(
      withSafeArea(
        <Conversation
          navigation={navigation as never}
          route={{
            key: 'k',
            name: 'Conversation',
            params: {
              userId: friend.id,
              username: friend.username,
              displayName: friend.displayName,
              avatarColor: friend.avatarColor,
            },
          }}
        />,
      ),
    );
    await act(async () => {});
    return { screen, navigation, social };
  }

  /** The header as it was last set. Each render replaces the last, so the
   * title is only rendered to be read, and the buttons are pressed through
   * their props, the screen staying rendered. */
  function headerOf(navigation: { setOptions: jest.Mock }) {
    const { headerTitle, unstable_headerRightItems } =
      navigation.setOptions.mock.calls.at(-1)[0];
    const [menu] = unstable_headerRightItems();
    expect(menu.hidesSharedBackground).toBe(true);
    return {
      renderTitle: () => render(headerTitle()),
      pressTitle: () => act(() => headerTitle().props.onPress()),
      openMenu: () => act(() => menu.element.props.onPress()),
    };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the messages, the friend as online in the header, and marks them read', async () => {
    const { screen, navigation, social } = await renderScreen();

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(social.markConversationRead).toHaveBeenCalledWith(FRIEND.id);
    const title = await headerOf(navigation).renderTitle();
    expect(title.getByTestId('conversation-presence')).toHaveTextContent(
      'Online',
    );
  });

  it("opens the friend's profile from the header", async () => {
    const { navigation } = await renderScreen();

    await headerOf(navigation).pressTitle();

    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      username: FRIEND.username,
    });
  });

  it('says in the header when the friend is typing', async () => {
    const { navigation } = await renderScreen();

    await act(() => fake.trigger('dm:typing', { userId: FRIEND.id }));
    const title = await headerOf(navigation).renderTitle();

    expect(title.getByTestId('conversation-presence')).toHaveTextContent(
      'typing…',
    );
  });

  it('sends a message, telling the friend I was typing it', async () => {
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
    await act(async () => {});

    expect(fake.socket.emit).toHaveBeenCalledWith('dm:typing', {
      userId: FRIEND.id,
    });
    expect(sendMessage).toHaveBeenCalledWith(
      FRIEND.username,
      { text: 'Rematch?' },
      'access-token',
    );
    expect(screen.getByText('Rematch?')).toBeTruthy();
    expect(screen.getByTestId('message-input').props.value).toBe('');
  });

  it("says why a message wasn't sent, and keeps it to retry", async () => {
    (sendMessage as jest.Mock).mockRejectedValue(
      new ApiError(403, 'You can only message friends'),
    );
    const { screen } = await renderScreen();

    await fireEvent.changeText(screen.getByTestId('message-input'), 'Hi');
    await fireEvent.press(screen.getByTestId('send-message-button'));
    await act(async () => {});

    expect(screen.getByText('You can only message friends')).toBeTruthy();
    expect(screen.getByText('Not sent · Tap to retry')).toBeTruthy();
  });

  it('shares one of my games', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'game-9' }),
    ]);
    (sendMessage as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { screen } = await renderScreen();

    await fireEvent.press(screen.getByTestId('attach-button'));
    await act(async () => {});
    await fireEvent.press(screen.getByTestId('game-row-game-9'));

    expect(sendMessage).toHaveBeenCalledWith(
      FRIEND.username,
      { text: '', attachment: { kind: 'game', gameId: 'game-9' } },
      'access-token',
    );
  });

  it('opens a game or position shared in the conversation', async () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    const { screen, navigation } = await renderScreen(FRIEND, [
      makeDirectMessage({
        id: 'p',
        text: '',
        attachment: { kind: 'position', fen },
      }),
    ]);

    await fireEvent.press(screen.getByTestId('message-p-attachment'));

    expect(navigation.navigate).toHaveBeenCalledWith('AnalysisBoard', {
      source: { kind: 'setup', fen },
    });
  });

  it('offers to watch the friend while they play', async () => {
    const playing = makeFriend({ online: true, playingGameId: 'live-game' });
    const { screen, navigation } = await renderScreen(playing);

    expect(screen.getByTestId('conversation-playing')).toHaveTextContent(
      /is playing right now/,
    );
    await fireEvent.press(screen.getByTestId('conversation-watch'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'live-game',
      watchedUserId: playing.id,
    });
  });

  it('challenges the friend from the menu', async () => {
    const { screen, navigation } = await renderScreen();

    await headerOf(navigation).openMenu();
    await fireEvent.press(screen.getByTestId('conversation-action-challenge'));
    await waitForSheetToClose();

    expect(screen.getByTestId('challenge-sheet')).toBeTruthy();
  });

  it('clears the conversation from the menu once confirmed', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) =>
        buttons?.find((button) => button.style === 'destructive')?.onPress?.(),
      );
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { screen, navigation } = await renderScreen();

    await headerOf(navigation).openMenu();
    await fireEvent.press(screen.getByTestId('clear-conversation-button'));
    await waitForSheetToClose();

    expect(clearMessages).toHaveBeenCalledWith(FRIEND.username, 'access-token');
    expect(screen.queryByText('Hello')).toBeNull();
  });
});

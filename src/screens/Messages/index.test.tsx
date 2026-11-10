import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Messages from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import {
  clearMessages,
  ConversationSummary,
  getConversations,
  markMessagesRead,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
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
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getConversations: jest.fn(),
  markMessagesRead: jest.fn(),
  clearMessages: jest.fn(),
}));
jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);

const ANA = makeFriend({
  id: 'ana',
  username: 'ana',
  displayName: 'Ana Kim',
  online: true,
});
const BO = makeFriend({ id: 'bo', username: 'bo', displayName: 'Bo Lee' });

function conversationWith(
  friend: typeof ANA,
  text: string,
): ConversationSummary {
  return {
    user: {
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      avatarColor: friend.avatarColor,
    },
    lastMessage: makeDirectMessage({
      id: `${friend.id}-last`,
      senderId: friend.id,
      text,
    }),
    unreadCount: 0,
    theirLastReadAt: null,
  };
}

describe('Messages', () => {
  let fake: FakeSocket;

  async function renderScreen({
    user = { id: 'user-1', isGuest: false },
    friends = [ANA, BO],
    conversations = [
      conversationWith(ANA, 'gg!'),
      conversationWith(BO, 'Rematch?'),
    ],
    unreadByUserId = { bo: 2 },
  }: {
    user?: { id: string; isGuest: boolean };
    friends?: (typeof ANA)[];
    conversations?: ConversationSummary[];
    unreadByUserId?: Record<string, number>;
  } = {}) {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user, socket: fake.socket }),
    );
    const social = makeSocial({ friends, unreadByUserId });
    (useSocialContext as jest.Mock).mockReturnValue(social);
    (getConversations as jest.Mock).mockResolvedValue(conversations);
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = await render(
      withSafeArea(<Messages navigation={navigation as never} />),
    );
    await act(async () => {});
    return { screen, navigation, social };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("lists my conversations, each friend's last message and what's unread", async () => {
    const { screen } = await renderScreen();

    expect(screen.getByText('gg!')).toBeTruthy();
    expect(screen.getByText('Rematch?')).toBeTruthy();
    expect(screen.getByTestId('conversation-bo-unread')).toHaveTextContent('2');
    expect(screen.queryByTestId('conversation-ana-unread')).toBeNull();
  });

  it('opens a conversation', async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('conversation-ana'));

    expect(navigation.navigate).toHaveBeenCalledWith('Conversation', {
      userId: 'ana',
      username: 'ana',
      displayName: 'Ana Kim',
      avatarColor: ANA.avatarColor,
    });
  });

  it('shows the friends online, a tap from a message', async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('online-friend-ana'));

    expect(screen.queryByTestId('online-friend-bo')).toBeNull();
    expect(navigation.navigate).toHaveBeenCalledWith(
      'Conversation',
      expect.objectContaining({ userId: 'ana' }),
    );
  });

  it('shows who is typing to me', async () => {
    const { screen } = await renderScreen();

    await act(() => fake.trigger('dm:typing', { userId: 'bo' }));

    expect(screen.getByTestId('conversation-bo-typing')).toBeTruthy();
  });

  it('narrows the list to the names searched for', async () => {
    const { screen } = await renderScreen();

    await fireEvent.changeText(screen.getByTestId('messages-search'), 'bo');
    expect(screen.queryByTestId('conversation-ana')).toBeNull();
    expect(screen.getByTestId('conversation-bo')).toBeTruthy();
    expect(screen.queryByTestId('online-friends')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('messages-search'), 'zed');
    expect(screen.getByTestId('messages-no-match')).toBeTruthy();
  });

  it('starts a new message with a friend picked from the header', async () => {
    const { screen, navigation } = await renderScreen();
    const [newMessage] = navigation.setOptions.mock.calls
      .at(-1)[0]
      .unstable_headerRightItems();

    await act(() => newMessage.element.props.onPress());
    await fireEvent.press(screen.getByTestId('friend-row-bo'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'Conversation',
      expect.objectContaining({ userId: 'bo' }),
    );
  });

  it('marks a conversation read from its menu', async () => {
    (markMessagesRead as jest.Mock).mockResolvedValue(undefined);
    const { screen, social } = await renderScreen();

    await fireEvent(screen.getByTestId('conversation-bo'), 'longPress');
    await fireEvent.press(screen.getByTestId('conversation-menu-mark-read'));

    expect(social.markConversationRead).toHaveBeenCalledWith('bo');
    expect(markMessagesRead).toHaveBeenCalledWith('bo', 'access-token');
  });

  it('deletes a conversation from its menu, once confirmed', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) =>
        buttons?.find((button) => button.style === 'destructive')?.onPress?.(),
      );
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { screen } = await renderScreen();

    await fireEvent(screen.getByTestId('conversation-ana'), 'longPress');
    expect(screen.queryByTestId('conversation-menu-mark-read')).toBeNull();
    await fireEvent.press(screen.getByTestId('conversation-menu-delete'));
    await waitForSheetToClose();

    expect(clearMessages).toHaveBeenCalledWith('ana', 'access-token');
    expect(screen.queryByTestId('conversation-ana')).toBeNull();
  });

  it('invites a first message, or friends to message', async () => {
    const withFriends = await renderScreen({ conversations: [] });
    expect(withFriends.screen.getByTestId('messages-empty-new')).toBeTruthy();

    const noFriends = await renderScreen({ conversations: [], friends: [] });
    await fireEvent.press(
      noFriends.screen.getByTestId('messages-empty-find-friends'),
    );
    expect(noFriends.navigation.navigate).toHaveBeenCalledWith('FindFriends', {
      focusSearch: true,
    });
  });

  it('asks a guest to sign in, with nothing to fetch', async () => {
    const { screen, navigation } = await renderScreen({
      user: { id: 'guest-1', isGuest: true },
    });

    expect(getConversations).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('sign-in-button'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });
});

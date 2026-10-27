import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Friends from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { ApiError } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';
import {
  makeFriend,
  makeFriendRequest,
  makeSocial,
} from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../context/SocialContext', () => ({
  useSocialContext: jest.fn(),
}));
jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);
jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

const ONLINE = makeFriend({
  id: 'online',
  displayName: 'Online',
  online: true,
});
const AWAY = makeFriend({ id: 'away', username: 'away', displayName: 'Away' });

describe('Friends', () => {
  async function renderScreen(
    social = makeSocial({ friends: [ONLINE, AWAY] }),
  ) {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest: false } }),
    );
    (useSocialContext as jest.Mock).mockReturnValue(social);
    const navigation = { navigate: jest.fn() };
    const screen = await render(
      withSafeArea(<Friends navigation={navigation as never} />),
    );
    return { screen, navigation, social };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows friends online first, and everyone under All', async () => {
    const { screen } = await renderScreen();

    expect(screen.getByText('1 online')).toBeTruthy();
    expect(screen.getByText('2 friends')).toBeTruthy();
    expect(screen.getByText('0 requests')).toBeTruthy();
    expect(screen.getByTestId('friend-row-online')).toBeTruthy();
    expect(screen.queryByTestId('friend-row-away')).toBeNull();

    await fireEvent.press(screen.getByTestId('tab-all'));
    expect(screen.getByTestId('friend-row-away')).toBeTruthy();
  });

  it("opens a friend's profile from their row", async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('friend-row-online'));

    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      username: ONLINE.username,
    });
  });

  it('sends a friend request by username', async () => {
    const { screen, social } = await renderScreen();

    await fireEvent.changeText(
      screen.getByTestId('add-friend-input'),
      ' magnus ',
    );
    await fireEvent.press(screen.getByTestId('add-friend-button'));

    expect(social.sendFriendRequest).toHaveBeenCalledWith('magnus');
    expect(screen.getByText('Friend request sent')).toBeTruthy();
  });

  it("shows why a friend request couldn't be sent", async () => {
    const social = makeSocial({
      friends: [],
      sendFriendRequest: jest
        .fn()
        .mockRejectedValue(new ApiError(404, 'User not found')),
    });
    const { screen } = await renderScreen(social);

    await fireEvent.changeText(
      screen.getByTestId('add-friend-input'),
      'nobody',
    );
    await fireEvent.press(screen.getByTestId('add-friend-button'));

    expect(screen.getByTestId('add-friend-error')).toHaveTextContent(
      'User not found',
    );
  });

  it('answers and cancels friend requests', async () => {
    const incoming = makeFriendRequest({ id: 'in' });
    const outgoing = makeFriendRequest({ id: 'out' });
    const social = makeSocial({
      requests: { incoming: [incoming], outgoing: [outgoing] },
    });
    const { screen } = await renderScreen(social);

    await fireEvent.press(screen.getByTestId('tab-requests'));
    await fireEvent.press(screen.getByTestId('decline-friend-in'));
    await fireEvent.press(screen.getByTestId('cancel-friend-out'));

    expect(social.respondToFriendRequest).toHaveBeenCalledWith('in', false);
    expect(social.cancelFriendRequest).toHaveBeenCalledWith('out');
  });

  it('removes a friend once confirmed', async () => {
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) =>
        buttons?.find((button) => button.style === 'destructive')?.onPress?.(),
      );
    const { screen, social } = await renderScreen(
      makeSocial({ friends: [AWAY] }),
    );

    await fireEvent.press(screen.getByTestId('tab-all'));
    await fireEvent.press(screen.getByTestId('remove-friend-away'));
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalled();
    expect(social.removeFriend).toHaveBeenCalledWith('away');
  });

  it('says where friends will show up before I have any', async () => {
    const { screen } = await renderScreen(makeSocial());

    expect(screen.getByTestId('online-empty')).toHaveTextContent(
      /Your friends will show up here once you connect/,
    );
    await fireEvent.press(screen.getByTestId('tab-all'));
    expect(screen.getByTestId('all-friends-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-requests'));
    expect(screen.getByTestId('requests-empty')).toBeTruthy();
  });

  it("says nobody's online when my friends are away", async () => {
    const { screen } = await renderScreen(makeSocial({ friends: [AWAY] }));

    expect(screen.getByTestId('online-empty')).toHaveTextContent(
      /Friends who are online right now will show up here/,
    );
  });

  it('counts a single friend in the singular', async () => {
    const { screen } = await renderScreen(makeSocial({ friends: [AWAY] }));

    expect(screen.getByText('1 friend')).toBeTruthy();
  });

  it('reloads friends when it comes into focus', async () => {
    const { social } = await renderScreen();

    expect(social.reload).toHaveBeenCalled();
  });
});

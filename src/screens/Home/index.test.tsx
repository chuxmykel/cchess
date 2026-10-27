import { act, fireEvent, render, within } from '@testing-library/react-native';

import Home from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { getMyGames } from '../../network/restClient';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';
import { makeGameSummary } from '../../testUtils/gameSummary';
import { withSafeArea } from '../../testUtils/safeArea';
import {
  makeChallenge,
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
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyGames: jest.fn(),
}));
jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);

const MAGNUS = {
  isGuest: false,
  displayName: 'Magnus Carlsen',
  avatarColor: '#3b82f6',
};

describe('Home', () => {
  async function renderScreen(session = makeAuthSession()) {
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { navigate: jest.fn() };
    const screen = await render(withSafeArea(<Home navigation={navigation} />));
    await act(async () => {});
    return { screen, navigation };
  }

  beforeEach(() => {
    (getMyGames as jest.Mock).mockResolvedValue([]);
    (useSocialContext as jest.Mock).mockReturnValue(makeSocial());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('as a guest', () => {
    it('offers to sign in where friends would be', async () => {
      const { screen } = await renderScreen();

      expect(screen.getByTestId('sign-in-prompt')).toBeTruthy();
      expect(screen.queryByText('Friends')).toBeNull();
    });

    it.each([
      ['sign-in-button', 'SignIn'],
      ['create-account-button', 'CreateAccount'],
    ])('%s opens %s', async (button, route) => {
      const { screen, navigation } = await renderScreen();

      await fireEvent.press(screen.getByTestId(button));

      expect(navigation.navigate).toHaveBeenCalledWith(route);
    });

    it('shows the generic avatar', async () => {
      const { screen } = await renderScreen();

      expect(
        within(screen.getByTestId('avatar-button')).getByTestId(
          'avatar-guest-icon',
        ),
      ).toBeTruthy();
    });
  });

  describe('when signed in', () => {
    it('shows friends instead of the sign-in prompt', async () => {
      const { screen } = await renderScreen(makeAuthSession({ user: MAGNUS }));

      expect(screen.getByText('Friends')).toBeTruthy();
      expect(screen.queryByTestId('sign-in-prompt')).toBeNull();
    });

    it("shows the player's initials in the header", async () => {
      const { screen } = await renderScreen(makeAuthSession({ user: MAGNUS }));

      expect(
        within(screen.getByTestId('avatar-button')).getByText('MC'),
      ).toBeTruthy();
    });
  });

  it("loads the player's recent games when it comes into focus", async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'game-1', opponentDisplayName: 'Judit Polgar' }),
    ]);

    const { screen } = await renderScreen(
      makeAuthSession({ accessToken: 'token-a' }),
    );

    expect(getMyGames).toHaveBeenCalledWith('token-a', 10);
    expect(screen.getByTestId('game-row-game-1')).toBeTruthy();
  });

  it('shows neither the prompt nor friends while the session is starting', async () => {
    const { screen } = await renderScreen(makeBootstrappingAuthSession());

    expect(screen.queryByTestId('sign-in-prompt')).toBeNull();
    expect(screen.queryByText('Friends')).toBeNull();
  });

  it('opens a new game from Play', async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('play-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('NewGame');
  });

  describe('friends and challenges', () => {
    const FRIEND = makeFriend({ online: true });

    async function renderSignedIn(social = makeSocial()) {
      (useSocialContext as jest.Mock).mockReturnValue(social);
      return renderScreen(makeAuthSession({ user: MAGNUS }));
    }

    it("shows my friends and opens a friend's profile", async () => {
      const { screen, navigation } = await renderSignedIn(
        makeSocial({ friends: [FRIEND] }),
      );

      await fireEvent.press(screen.getByTestId(`friend-card-${FRIEND.id}`));

      expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
        username: FRIEND.username,
      });
    });

    it('reloads friends when it comes into focus', async () => {
      const social = makeSocial();

      await renderSignedIn(social);

      expect(social.reload).toHaveBeenCalled();
    });

    it('invites me to add friends when I have none', async () => {
      const { screen, navigation } = await renderSignedIn();

      await fireEvent.press(screen.getByTestId('add-friends-prompt'));

      expect(navigation.navigate).toHaveBeenCalledWith('Friends', {
        focusSearch: true,
      });
    });

    const CHALLENGE = makeChallenge({
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    it('counts incoming challenges and friend requests on the bell', async () => {
      const { screen } = await renderSignedIn(
        makeSocial({
          challenges: { incoming: [CHALLENGE], outgoing: [makeChallenge()] },
          requests: { incoming: [makeFriendRequest()], outgoing: [] },
        }),
      );

      expect(screen.getByTestId('notifications-badge')).toHaveTextContent('2');
      expect(screen.queryByTestId('notifications-menu')).toBeNull();
    });

    it('accepts and declines an incoming challenge', async () => {
      const challenge = CHALLENGE;
      const social = makeSocial({
        challenges: { incoming: [challenge], outgoing: [] },
      });
      const { screen } = await renderSignedIn(social);

      await fireEvent.press(screen.getByTestId('notifications-button'));
      await fireEvent.press(
        screen.getByTestId(`accept-challenge-${challenge.id}`),
      );
      await fireEvent.press(
        screen.getByTestId(`decline-challenge-${challenge.id}`),
      );

      expect(social.acceptChallenge).toHaveBeenCalledWith(challenge.id);
      expect(social.declineChallenge).toHaveBeenCalledWith(challenge.id);
    });

    it('accepts an incoming friend request', async () => {
      const request = makeFriendRequest();
      const social = makeSocial({
        requests: { incoming: [request], outgoing: [] },
      });
      const { screen } = await renderSignedIn(social);

      await fireEvent.press(screen.getByTestId('notifications-button'));
      await fireEvent.press(screen.getByTestId(`accept-friend-${request.id}`));

      expect(social.respondToFriendRequest).toHaveBeenCalledWith(
        request.id,
        true,
      );
    });

    it('closes the notifications to show what went wrong', async () => {
      const social = makeSocial({
        challenges: { incoming: [CHALLENGE], outgoing: [] },
        acceptChallenge: jest
          .fn()
          .mockRejectedValue(new Error('Challenge expired')),
      });
      const { screen } = await renderSignedIn(social);

      await fireEvent.press(screen.getByTestId('notifications-button'));
      await fireEvent.press(
        screen.getByTestId(`accept-challenge-${CHALLENGE.id}`),
      );

      expect(screen.queryByTestId('notifications-menu')).toBeNull();
      expect(screen.getByText('Challenge expired')).toBeTruthy();
    });

    it('has no bell for a guest', async () => {
      const { screen } = await renderScreen();

      expect(screen.queryByTestId('notifications-button')).toBeNull();
    });

    it("opens a friend's live game from their card", async () => {
      const playing = makeFriend({ online: true, playingGameId: 'game-5' });
      const { screen, navigation } = await renderSignedIn(
        makeSocial({ friends: [playing] }),
      );

      await fireEvent.press(screen.getByTestId(`friend-watch-${playing.id}`));

      expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
        gameId: 'game-5',
      });
    });
  });

  it('opens a recent game in the viewer', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'game-3' }),
    ]);
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('game-row-game-3'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'game-3',
    });
  });

  it('shows all my games from See All', async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('recent-games-see-all'));

    expect(navigation.navigate).toHaveBeenCalledWith('GamesList', {});
  });
});

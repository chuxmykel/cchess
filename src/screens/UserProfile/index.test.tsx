import { act, fireEvent, render } from '@testing-library/react-native';

import { Animated } from 'react-native';

import UserProfile from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import {
  getUserActivity,
  getUserFriends,
  getUserGames,
  getUserProfile,
  UserProfile as Profile,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeGameSummary } from '../../testUtils/gameSummary';
import { withSafeArea } from '../../testUtils/safeArea';
import {
  makeFriend,
  makeSocial,
  makeUserFriend,
  makeUserProfile,
} from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../context/SocialContext', () => ({
  useSocialContext: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getUserProfile: jest.fn(),
  getUserActivity: jest.fn(),
  getUserGames: jest.fn(),
  getUserFriends: jest.fn(),
}));

describe('UserProfile', () => {
  async function renderScreen(
    profile: Profile,
    social = makeSocial(),
    games = [makeGameSummary({ id: 'their-game' })],
    friends = [makeUserFriend({ id: 'their-friend', username: 'zsuzsa' })],
  ) {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest: false } }),
    );
    (useSocialContext as jest.Mock).mockReturnValue(social);
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (getUserActivity as jest.Mock).mockResolvedValue([]);
    (getUserGames as jest.Mock).mockResolvedValue(games);
    (getUserFriends as jest.Mock).mockResolvedValue(friends);
    const navigation = {
      navigate: jest.fn(),
      push: jest.fn(),
      setOptions: jest.fn(),
    };
    const screen = await render(
      withSafeArea(
        <UserProfile
          navigation={navigation as never}
          route={{
            key: 'k',
            name: 'UserProfile',
            params: { username: profile.username },
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

  it("shows a friend's totals, score and what I can do with them", async () => {
    const { screen } = await renderScreen(makeUserProfile());

    expect(screen.getByText('@judit')).toBeTruthy();
    expect(screen.getByText('Joined June 1, 2025')).toBeTruthy();
    expect(screen.getByText('42 games played')).toBeTruthy();
    expect(screen.getByText('Time spent playing: 3 hours')).toBeTruthy();
    expect(screen.getByTestId('profile-score')).toHaveTextContent(
      'Score vs judit: 2½ - 3½',
    );
    expect(screen.getByTestId('profile-challenge')).toBeTruthy();
    expect(screen.getByTestId('profile-message')).toBeTruthy();
    expect(screen.getByTestId('profile-watch')).toBeDisabled();
  });

  it('fades the username into the header once the avatar block scrolls away', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const { screen, navigation } = await renderScreen(makeUserProfile());
    const { headerTitle } = (navigation.setOptions as jest.Mock).mock.calls.at(
      -1,
    )[0];
    // Not rendered: a second render would replace the screen under test.
    expect(headerTitle().props.children).toBe('judit');
    // The title's fade - other parts of the screen animate too.
    const fadedTo = () =>
      timing.mock.calls
        .filter(([, config]) => config.duration === 200)
        .at(-1)?.[1].toValue;
    expect(fadedTo()).toBe(0);

    await fireEvent(screen.getByTestId('profile-identity'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 96 } },
    });
    const scrollTo = (y: number) =>
      fireEvent.scroll(screen.getByTestId('user-profile-screen'), {
        nativeEvent: { contentOffset: { x: 0, y } },
      });

    await scrollTo(60);
    expect(fadedTo()).toBe(0);
    await scrollTo(120);
    expect(fadedTo()).toBe(1);
    await scrollTo(10);
    expect(fadedTo()).toBe(0);
    timing.mockRestore();
  });

  it("opens a player's stats in a category", async () => {
    const { screen, navigation } = await renderScreen(makeUserProfile());

    await fireEvent.press(screen.getByTestId('rating-blitz'));

    expect(navigation.navigate).toHaveBeenCalledWith('RatingStats', {
      username: 'judit',
      displayName: 'Judit Polgar',
      category: 'blitz',
    });
  });

  it('messages a friend', async () => {
    const profile = makeUserProfile();
    const { screen, navigation } = await renderScreen(profile);

    await fireEvent.press(screen.getByTestId('profile-message'));

    expect(navigation.navigate).toHaveBeenCalledWith('Conversation', {
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarColor: profile.avatarColor,
    });
  });

  it('watches the game a player is in', async () => {
    const { screen, navigation } = await renderScreen(
      makeUserProfile({ online: true, playingGameId: 'live-game' }),
    );

    await fireEvent.press(screen.getByTestId('profile-watch'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'live-game',
    });
  });

  it('adds someone who is not a friend yet, then reloads', async () => {
    const profile = makeUserProfile({
      friendship: { status: 'none', requestId: null },
    });
    const { screen, social } = await renderScreen(profile);
    expect(screen.queryByTestId('profile-message')).toBeNull();

    await fireEvent.press(screen.getByTestId('profile-add-friend'));
    await act(async () => {});

    expect(social.sendFriendRequest).toHaveBeenCalledWith(profile.username);
    expect(getUserProfile).toHaveBeenCalledTimes(2);
    expect(getUserFriends).toHaveBeenCalledTimes(2);
  });

  it("challenges someone I'm not friends with", async () => {
    const { screen } = await renderScreen(
      makeUserProfile({ friendship: { status: 'none', requestId: null } }),
    );

    await fireEvent.press(screen.getByTestId('profile-challenge'));

    expect(screen.getByTestId('challenge-sheet')).toBeTruthy();
  });

  it("can't watch a player who isn't in a game", async () => {
    const { screen } = await renderScreen(
      makeUserProfile({
        friendship: { status: 'none', requestId: null },
        playingGameId: null,
      }),
    );

    expect(screen.getByTestId('profile-watch')).toBeDisabled();
  });

  it("watches the game of a player I'm not friends with", async () => {
    const { screen, navigation } = await renderScreen(
      makeUserProfile({
        friendship: { status: 'none', requestId: null },
        playingGameId: 'their-live-game',
      }),
    );

    await fireEvent.press(screen.getByTestId('profile-watch'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'their-live-game',
    });
  });

  it('accepts a friend request they sent me', async () => {
    const { screen, social } = await renderScreen(
      makeUserProfile({
        friendship: { status: 'incoming', requestId: 'req-1' },
      }),
    );

    await fireEvent.press(screen.getByTestId('profile-accept-request'));

    expect(social.respondToFriendRequest).toHaveBeenCalledWith('req-1', true);
  });

  it('shows no actions on my own profile', async () => {
    const { screen } = await renderScreen(
      makeUserProfile({
        friendship: { status: 'self', requestId: null },
        score: null,
      }),
    );

    expect(screen.queryByTestId('profile-score')).toBeNull();
    expect(screen.queryByTestId('profile-add-friend')).toBeNull();
  });

  it('says their games and activity will show up once they play', async () => {
    const { screen } = await renderScreen(makeUserProfile(), makeSocial(), []);

    expect(screen.getByTestId('profile-games-empty')).toHaveTextContent(
      /Judit Polgar's recent games will show up here/,
    );
    expect(screen.getByTestId('activity-empty')).toHaveTextContent(
      /Judit Polgar's games from the last 30 days/,
    );
  });

  it('speaks to me about my own empty profile', async () => {
    const { screen } = await renderScreen(
      makeUserProfile({
        friendship: { status: 'self', requestId: null },
        score: null,
      }),
      makeSocial(),
      [],
    );

    expect(screen.getByTestId('profile-games-empty')).toHaveTextContent(
      /Your recent games will show up here/,
    );
  });

  it('shows their friends and how many, opening one or them all', async () => {
    const { screen, navigation } = await renderScreen(
      makeUserProfile({ friendsCount: 1 }),
    );

    expect(getUserFriends).toHaveBeenCalledWith('judit', 'access-token');
    expect(
      screen.getByTestId('profile-friends-view-all-count'),
    ).toHaveTextContent('1', { exact: false });
    await fireEvent.press(screen.getByTestId('profile-friend-their-friend'));
    expect(navigation.push).toHaveBeenCalledWith('UserProfile', {
      username: 'zsuzsa',
    });
    await fireEvent.press(screen.getByTestId('profile-friends-view-all'));
    expect(navigation.navigate).toHaveBeenCalledWith('UserFriends', {
      username: 'judit',
      displayName: 'Judit Polgar',
    });
  });

  it('offers to add friends from my own profile, opening Friends', async () => {
    const { screen, navigation } = await renderScreen(
      makeUserProfile({ friendship: { status: 'self', requestId: null } }),
    );

    await fireEvent.press(screen.getByTestId('profile-add-friends'));

    expect(navigation.navigate).toHaveBeenCalledWith('FindFriends', {
      focusSearch: true,
    });
  });

  it("offers no way to add friends on someone else's profile", async () => {
    const { screen } = await renderScreen(makeUserProfile());

    expect(screen.getByTestId('profile-friend-their-friend')).toBeTruthy();
    expect(screen.queryByTestId('profile-add-friends')).toBeNull();
  });

  it('says their friends will show up once they have some', async () => {
    const { screen } = await renderScreen(
      makeUserProfile(),
      makeSocial(),
      [],
      [],
    );

    expect(screen.getByTestId('profile-friends-empty')).toHaveTextContent(
      /Judit Polgar's friends will show up here/,
    );
  });

  it('opens one of their recent games', async () => {
    const { screen, navigation } = await renderScreen(makeUserProfile());

    await fireEvent.press(screen.getByTestId('game-row-their-game'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'their-game',
    });
  });

  it("follows a friend's live status rather than the profile's", async () => {
    const profile = makeUserProfile({ online: true });
    const { screen } = await renderScreen(
      profile,
      makeSocial({
        friends: [
          makeFriend({ id: profile.id, online: true, playingGameId: 'now' }),
        ],
      }),
    );

    expect(screen.getByTestId('profile-presence')).toHaveTextContent(
      'Playing right now',
    );
    expect(screen.getByTestId('profile-watch')).toBeTruthy();
  });
});

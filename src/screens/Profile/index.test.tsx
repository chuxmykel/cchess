import { act, fireEvent, render, within } from '@testing-library/react-native';

import Profile from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, getUserFriends } from '../../network/restClient';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeUserFriend } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getUserFriends: jest.fn(),
}));
jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);

const MAGNUS = {
  isGuest: false,
  username: 'magnus',
  displayName: 'Magnus Carlsen',
  ratings: [
    {
      category: 'blitz' as const,
      rating: 1516,
      gamesPlayed: 3,
      provisional: false,
    },
  ],
};

describe('Profile', () => {
  function renderScreen(session = makeAuthSession()) {
    (useAuthSession as jest.Mock).mockReturnValue(session);
    (getUserFriends as jest.Mock).mockResolvedValue([
      makeUserFriend({ id: 'my-friend', username: 'hikaru' }),
    ]);
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(withSafeArea(<Profile navigation={navigation} />)),
      session,
      navigation,
    };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('as a guest', () => {
    it('offers to sign in instead of showing ratings', async () => {
      const { screenPromise } = renderScreen();
      const screen = await screenPromise;

      expect(screen.getByTestId('sign-in-prompt')).toBeTruthy();
      expect(screen.queryByText('Ratings')).toBeNull();
      expect(screen.queryByTestId('profile-friends-view-all')).toBeNull();
      expect(getUserFriends).not.toHaveBeenCalled();
      expect(screen.queryByTestId('sign-out-button')).toBeNull();
    });

    it.each([
      ['sign-in-button', 'SignIn'],
      ['create-account-button', 'CreateAccount'],
    ])('%s opens %s', async (button, route) => {
      const { screenPromise, navigation } = renderScreen();
      const screen = await screenPromise;

      await fireEvent.press(screen.getByTestId(button));

      expect(navigation.navigate).toHaveBeenCalledWith(route);
    });

    it("doesn't reload the user, since guests have no ratings", async () => {
      const { screenPromise, session } = renderScreen();
      await screenPromise;

      expect(session.reloadUser).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    it('shows who is signed in and their ratings', async () => {
      const { screenPromise } = renderScreen(makeAuthSession({ user: MAGNUS }));
      const screen = await screenPromise;

      expect(screen.getByText('Magnus Carlsen')).toBeTruthy();
      expect(screen.getByText('@magnus')).toBeTruthy();
      expect(
        within(screen.getByTestId('rating-blitz')).getByText('1516'),
      ).toBeTruthy();
      expect(screen.queryByTestId('sign-in-prompt')).toBeNull();
    });

    it('shows their friends, opening one, all of them, or Friends to add more', async () => {
      const { screenPromise, navigation } = renderScreen(
        makeAuthSession({ user: MAGNUS }),
      );
      const screen = await screenPromise;
      await act(async () => {});

      expect(getUserFriends).toHaveBeenCalledWith('magnus', 'access-token');
      expect(
        screen.getByTestId('profile-friends-view-all-count'),
      ).toHaveTextContent('1', { exact: false });
      await fireEvent.press(screen.getByTestId('profile-friend-my-friend'));
      expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
        username: 'hikaru',
      });
      await fireEvent.press(screen.getByTestId('profile-friends-view-all'));
      expect(navigation.navigate).toHaveBeenCalledWith('UserFriends', {
        username: 'magnus',
        displayName: 'Magnus Carlsen',
      });
      await fireEvent.press(screen.getByTestId('profile-add-friends'));
      expect(navigation.navigate).toHaveBeenCalledWith('FindFriends', {
        focusSearch: true,
      });
    });

    it('opens their stats in a category', async () => {
      const { screenPromise, navigation } = renderScreen(
        makeAuthSession({ user: MAGNUS }),
      );
      const screen = await screenPromise;

      await fireEvent.press(screen.getByTestId('rating-blitz'));

      expect(navigation.navigate).toHaveBeenCalledWith('RatingStats', {
        username: 'magnus',
        displayName: 'Magnus Carlsen',
        category: 'blitz',
      });
    });

    it('reloads the user for up-to-date ratings', async () => {
      const { screenPromise, session } = renderScreen(
        makeAuthSession({ user: MAGNUS }),
      );
      await screenPromise;

      expect(session.reloadUser).toHaveBeenCalledTimes(1);
    });

    it('signs out', async () => {
      const { screenPromise, session } = renderScreen(
        makeAuthSession({ user: MAGNUS }),
      );
      const screen = await screenPromise;

      await fireEvent.press(screen.getByTestId('sign-out-button'));

      expect(session.signOut).toHaveBeenCalledTimes(1);
    });

    it('says so when signing out fails', async () => {
      const session = makeAuthSession({ user: MAGNUS });
      (session.signOut as jest.Mock).mockRejectedValue(
        new ApiError(0, 'Network Error'),
      );
      const { screenPromise } = renderScreen(session);
      const screen = await screenPromise;

      await act(() => fireEvent.press(screen.getByTestId('sign-out-button')));

      expect(
        screen.getByText("Couldn't sign out. Please try again."),
      ).toBeTruthy();
    });
  });

  it('waits for the session before showing anything', async () => {
    const { screenPromise } = renderScreen(makeBootstrappingAuthSession());
    const screen = await screenPromise;

    expect(screen.queryByTestId('sign-in-prompt')).toBeNull();
    expect(screen.queryByText('Ratings')).toBeNull();
  });
});

import { act, fireEvent, render, within } from '@testing-library/react-native';

import Home from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

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
        within(screen.getByTestId('avatar-button')).getByText('\u{1F464}'),
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
});

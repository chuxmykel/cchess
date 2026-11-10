import { fireEvent, render } from '@testing-library/react-native';

import Menu from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

const MAGNUS = {
  isGuest: false,
  username: 'magnus',
  displayName: 'Magnus Carlsen',
};

describe('Menu', () => {
  async function renderMenu(session = makeAuthSession({ user: MAGNUS })) {
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { navigate: jest.fn() };
    const screen = await render(<Menu navigation={navigation} />);
    return { screen, navigation, session };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['analysis-new', 'AnalysisBoard', { source: { kind: 'new' } }],
    ['analysis-set-up', 'AnalysisBoard', { source: { kind: 'setup' } }],
    ['analysis-pick-game', 'PickGame', undefined],
    ['analysis-paste', 'PasteGame', undefined],
    [
      'menu-opening-explorer',
      'OpeningExplorer',
      {
        startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        uciMoves: [],
        orientation: 'w',
      },
    ],
    ['menu-settings', 'Settings', undefined],
    ['menu-players', 'FindFriends', { focusSearch: true }],
  ])('%s opens %s', async (testID, route, params) => {
    const { screen, navigation } = await renderMenu();

    await fireEvent.press(screen.getByTestId(testID));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ...(params ? [route, params] : [route]),
    );
  });

  it('lists the analysis items with the opening explorer after New analysis', async () => {
    const { screen } = await renderMenu();

    expect(
      screen
        .getAllByTestId(/^(analysis-|menu-opening-explorer)/)
        .map((item) => item.props.testID),
    ).toEqual([
      'analysis-new',
      'menu-opening-explorer',
      'analysis-set-up',
      'analysis-pick-game',
      'analysis-paste',
    ]);
  });

  it('opens my own profile, the same screen as anyone else’s', async () => {
    const { screen, navigation } = await renderMenu();

    expect(screen.getByText('Magnus Carlsen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('menu-profile'));

    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      username: 'magnus',
    });
  });

  it('signs out', async () => {
    const { screen, session } = await renderMenu();

    await fireEvent.press(screen.getByTestId('sign-out-button'));

    expect(session.signOut).toHaveBeenCalled();
  });

  it('says so when signing out fails', async () => {
    const session = makeAuthSession({ user: MAGNUS });
    (session.signOut as jest.Mock).mockRejectedValue(
      new ApiError(500, 'Server is down'),
    );
    const { screen } = await renderMenu(session);

    await fireEvent.press(screen.getByTestId('sign-out-button'));

    expect(screen.getByText('Server is down')).toBeTruthy();
  });

  describe('as a guest', () => {
    it.each([
      ['sign-in-button', 'SignIn'],
      ['create-account-button', 'CreateAccount'],
    ])('offers to sign in: %s opens %s', async (button, route) => {
      const { screen, navigation } = await renderMenu(makeAuthSession());

      expect(screen.queryByTestId('menu-profile')).toBeNull();
      expect(screen.queryByTestId('menu-players')).toBeNull();
      expect(screen.queryByTestId('sign-out-button')).toBeNull();
      await fireEvent.press(screen.getByTestId(button));

      expect(navigation.navigate).toHaveBeenCalledWith(route);
    });

    it('still offers analysis and settings', async () => {
      const { screen } = await renderMenu(makeAuthSession());

      expect(screen.getByTestId('analysis-new')).toBeTruthy();
      expect(screen.getByTestId('menu-settings')).toBeTruthy();
    });
  });
});

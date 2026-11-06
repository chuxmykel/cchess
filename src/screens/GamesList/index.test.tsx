import { act, fireEvent, render } from '@testing-library/react-native';

import GamesList from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getMyGames, getUserGames } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeGameSummary } from '../../testUtils/gameSummary';

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyGames: jest.fn(),
  getUserGames: jest.fn(),
}));

describe('GamesList', () => {
  async function renderScreen(params: {
    username?: string;
    displayName?: string;
  }) {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = await render(
      <GamesList
        navigation={navigation as never}
        route={{ key: 'k', name: 'GamesList', params }}
      />,
    );
    await act(async () => {});
    return { screen, navigation };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists my games and opens one', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'mine' }),
    ]);
    const { screen, navigation } = await renderScreen({});

    expect(navigation.setOptions).toHaveBeenCalledWith({
      title: 'Game history',
    });
    await fireEvent.press(screen.getByTestId('game-row-mine'));
    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'mine',
    });
  });

  it("lists another player's games", async () => {
    (getUserGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'theirs' }),
    ]);
    const { screen, navigation } = await renderScreen({
      username: 'judit',
      displayName: 'Judit',
    });

    expect(getUserGames).toHaveBeenCalledWith(
      'judit',
      { limit: 20, before: undefined },
      'access-token',
      {},
    );
    expect(navigation.setOptions).toHaveBeenCalledWith({
      title: "Judit's games",
    });
    expect(screen.getByTestId('game-row-theirs')).toBeTruthy();
  });

  it.each([
    [{}, 'Every game you finish will show up here.'],
    [
      { username: 'judit', displayName: 'Judit' },
      "Judit's finished games will show up here.",
    ],
  ])(
    'says whose games will show up when there are none',
    async (params, text) => {
      (getMyGames as jest.Mock).mockResolvedValue([]);
      (getUserGames as jest.Mock).mockResolvedValue([]);
      const { screen } = await renderScreen(params);

      expect(screen.getByTestId('games-empty')).toBeTruthy();
      expect(screen.getByText(text)).toBeTruthy();
    },
  );

  it('asks for only the games won, drawn or lost, and of a type', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([]);
    const { screen } = await renderScreen({});

    // Both menus start open here (popoverMenuStartingOpen).
    await fireEvent.press(screen.getByTestId('games-result-filter-loss'));
    await act(async () => {});
    await fireEvent.press(screen.getByTestId('games-type-filter-blitz'));
    await act(async () => {});

    expect(getMyGames).toHaveBeenLastCalledWith('access-token', 20, undefined, {
      result: 'loss',
      gameType: 'blitz',
    });
    expect(
      screen.getByText('No finished games match these filters.'),
    ).toBeTruthy();
  });

  it("filters another player's games the same way", async () => {
    (getUserGames as jest.Mock).mockResolvedValue([]);
    const { screen } = await renderScreen({
      username: 'judit',
      displayName: 'Judit',
    });

    await fireEvent.press(screen.getByTestId('games-result-filter-win'));
    await act(async () => {});

    expect(getUserGames).toHaveBeenLastCalledWith(
      'judit',
      { limit: 20, before: undefined },
      'access-token',
      { result: 'win' },
    );
  });

  it('offers to retry when the games fail to load', async () => {
    (getMyGames as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const { screen } = await renderScreen({});

    expect(screen.getByTestId('games-error')).toBeTruthy();
  });
});

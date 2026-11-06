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

  it('narrows the games fetched to a result and a type, asking for none again', async () => {
    (getMyGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'blitz-loss', result: 'loss', gameType: 'blitz' }),
      makeGameSummary({ id: 'blitz-win', result: 'win', gameType: 'blitz' }),
      makeGameSummary({ id: 'rapid-loss', result: 'loss', gameType: 'rapid' }),
    ]);
    const { screen } = await renderScreen({});

    // Both menus start open here (popoverMenuStartingOpen).
    await fireEvent.press(screen.getByTestId('games-result-filter-loss'));
    await fireEvent.press(screen.getByTestId('games-type-filter-blitz'));

    expect(screen.getByTestId('game-row-blitz-loss')).toBeTruthy();
    expect(screen.queryByTestId('game-row-blitz-win')).toBeNull();
    expect(screen.queryByTestId('game-row-rapid-loss')).toBeNull();
    expect(getMyGames).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('games-result-filter'));
    await fireEvent.press(screen.getByTestId('games-result-filter-draw'));
    expect(
      screen.getByText('No finished games match these filters.'),
    ).toBeTruthy();
  });

  it('fetches on while too few of the games match', async () => {
    const page = (prefix: string, start: number) =>
      Array.from({ length: 20 }, (_, i) =>
        makeGameSummary({
          id: `${prefix}-${i}`,
          result: i === 0 ? 'win' : 'loss',
          createdAt: new Date(start - i * 60_000).toISOString(),
        }),
      );
    const first = page('first', Date.UTC(2026, 10, 6));
    (getMyGames as jest.Mock)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(page('second', Date.UTC(2026, 10, 5)))
      .mockResolvedValue([]);
    const { screen } = await renderScreen({});

    await fireEvent.press(screen.getByTestId('games-result-filter-win'));
    await act(async () => {});

    expect(getMyGames).toHaveBeenNthCalledWith(
      2,
      'access-token',
      20,
      first.at(-1)!.createdAt,
    );
    expect(screen.getByTestId('game-row-first-0')).toBeTruthy();
    expect(screen.getByTestId('game-row-second-0')).toBeTruthy();
    expect(getMyGames).toHaveBeenCalledTimes(3);
  });

  it("filters another player's games the same way", async () => {
    (getUserGames as jest.Mock).mockResolvedValue([
      makeGameSummary({ id: 'won', result: 'win' }),
      makeGameSummary({ id: 'drawn', result: 'draw' }),
    ]);
    const { screen } = await renderScreen({
      username: 'judit',
      displayName: 'Judit',
    });

    await fireEvent.press(screen.getByTestId('games-result-filter-win'));

    expect(screen.getByTestId('game-row-won')).toBeTruthy();
    expect(screen.queryByTestId('game-row-drawn')).toBeNull();
  });

  it('fetches the games again when pulled down', async () => {
    (getMyGames as jest.Mock)
      .mockResolvedValueOnce([makeGameSummary({ id: 'old' })])
      .mockResolvedValue([makeGameSummary({ id: 'new' })]);
    const { screen } = await renderScreen({});

    const { refreshControl } = screen.getByTestId('games-list').props;
    await act(async () => refreshControl.props.onRefresh());

    expect(screen.getByTestId('game-row-new')).toBeTruthy();
    expect(
      screen.getByTestId('games-list').props.refreshControl.props.refreshing,
    ).toBe(false);
  });

  it('offers to retry when the games fail to load', async () => {
    (getMyGames as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const { screen } = await renderScreen({});

    expect(screen.getByTestId('games-error')).toBeTruthy();
  });
});

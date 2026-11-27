import { act, fireEvent, render } from '@testing-library/react-native';

import RatingStats from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getPuzzleStats, getRatingStats } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makePuzzleStats } from '../../testUtils/puzzleStats';
import { makeRatingStats } from '../../testUtils/ratingStats';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getRatingStats: jest.fn(),
  getPuzzleStats: jest.fn(),
}));

describe('RatingStats', () => {
  async function renderScreen(category: string = 'blitz') {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    const navigation = {
      navigate: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
    };
    const screen = await render(
      <RatingStats
        navigation={navigation as never}
        route={{
          key: 'k',
          name: 'RatingStats',
          params: {
            username: 'judit',
            displayName: 'Judit Polgar',
            category: category as never,
          },
        }}
      />,
    );
    await act(async () => {});
    return { screen, navigation };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the rating, what it gained over the month, and the month's stats", async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(makeRatingStats());

    const { screen } = await renderScreen();

    expect(getRatingStats).toHaveBeenCalledWith(
      'judit',
      'blitz',
      '1m',
      'access-token',
    );
    expect(screen.getByTestId('rating-stats-rating')).toHaveTextContent('1662');
    expect(screen.getByLabelText('Up 12 points')).toBeTruthy();
    expect(screen.getByText('Past month')).toBeTruthy();
    expect(screen.getByTestId('tab-1m')).toBeSelected();
    expect(screen.getByTestId('rating-chart')).toBeTruthy();
    expect(screen.getByTestId('rating-highest')).toHaveTextContent(/1670/);
    expect(screen.getByTestId('category-stats')).toBeTruthy();
  });

  it('switches category from the header', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(makeRatingStats());
    const { navigation } = await renderScreen();

    const { headerTitle } = navigation.setOptions.mock.calls.at(-1)[0];
    const header = await render(headerTitle());
    await fireEvent.press(header.getByTestId('rating-category-rapid'));

    expect(navigation.setParams).toHaveBeenCalledWith({ category: 'rapid' });
  });

  it('loads the stats for another period', async () => {
    (getRatingStats as jest.Mock)
      .mockResolvedValueOnce(makeRatingStats())
      .mockResolvedValueOnce(
        makeRatingStats({ period: '1y', ratingChange: -30 }),
      );
    const { screen } = await renderScreen();

    await fireEvent.press(screen.getByTestId('tab-1y'));
    await act(async () => {});

    expect(getRatingStats).toHaveBeenLastCalledWith(
      'judit',
      'blitz',
      '1y',
      'access-token',
    );
    expect(screen.getByLabelText('Down 30 points')).toBeTruthy();
    expect(screen.getByText('Past year')).toBeTruthy();
  });

  const noGamesInPeriod = {
    history: [],
    highest: null,
    lowest: null,
    ratingChange: null,
  };

  it('draws the rating across a period with no rated games in it', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(
      makeRatingStats(noGamesInPeriod),
    );

    const { screen } = await renderScreen();

    const chart = screen.getByTestId('cartesian-chart').props;
    expect(chart.data.map((datum: { rating: number }) => datum.rating)).toEqual(
      [1662, 1662],
    );
    expect(screen.queryByTestId('rating-chart-empty')).toBeNull();
    expect(screen.queryByTestId('rating-stats-change')).toBeNull();
  });

  it('says there is nothing to chart before any rated games', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(
      makeRatingStats({
        ...noGamesInPeriod,
        rating: {
          category: 'blitz',
          rating: 1500,
          gamesPlayed: 0,
          provisional: true,
        },
      }),
    );

    const { screen } = await renderScreen();

    expect(screen.getByTestId('rating-chart-empty')).toBeTruthy();
    expect(screen.queryByTestId('cartesian-chart')).toBeNull();
  });

  it('says there is nothing to chart for all time with no rated games', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(
      makeRatingStats({ ...noGamesInPeriod, period: 'all' }),
    );

    const { screen } = await renderScreen();

    expect(screen.getByTestId('rating-chart-empty')).toBeTruthy();
  });

  it('opens the best win', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(makeRatingStats());
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('stats-best-win'));

    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'game-best',
    });
  });

  it('offers to try again when the stats fail to load', async () => {
    (getRatingStats as jest.Mock)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(makeRatingStats());
    const { screen } = await renderScreen();

    expect(screen.getByTestId('rating-stats-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    await act(async () => {});

    expect(screen.getByTestId('rating-stats-screen')).toBeTruthy();
  });

  it('fetches the stats again when pulled down', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(makeRatingStats());
    const { screen } = await renderScreen();

    const { refreshControl } = screen.getByTestId('rating-stats-screen').props;
    await act(async () => refreshControl.props.onRefresh());

    expect(getRatingStats).toHaveBeenCalledTimes(2);
  });

  describe('puzzles', () => {
    it('charts the puzzle rating, with the tries, solves and themes', async () => {
      (getPuzzleStats as jest.Mock).mockResolvedValue(makePuzzleStats());

      const { screen } = await renderScreen('puzzles');

      expect(getPuzzleStats).toHaveBeenCalledWith(
        'judit',
        '1m',
        'access-token',
      );
      expect(getRatingStats).not.toHaveBeenCalled();
      expect(screen.getByText('Judit Polgar · Puzzles')).toBeTruthy();
      expect(screen.getByTestId('rating-stats-rating')).toHaveTextContent(
        '1588',
      );
      expect(screen.getByLabelText('Up 88 points')).toBeTruthy();
      expect(screen.getByTestId('rating-chart')).toBeTruthy();
      expect(screen.getByTestId('puzzle-stats-attempts')).toHaveTextContent(
        '12',
      );
      expect(screen.getByTestId('puzzle-stats-solved')).toHaveTextContent(
        /9\s*Solved · 75%/,
      );
      expect(screen.getByTestId('puzzle-stats-best-solve')).toHaveTextContent(
        /Rated 1840/,
      );
      expect(
        screen.getByTestId('puzzle-stats-strongest-themes'),
      ).toHaveTextContent(/Forks · 100% of 6/);
      expect(
        screen.getByTestId('puzzle-stats-weakest-themes'),
      ).toHaveTextContent(/Pins · 25% of 4/);
    });

    it('asks for another period from its tabs', async () => {
      (getPuzzleStats as jest.Mock).mockResolvedValue(makePuzzleStats());
      const { screen } = await renderScreen('puzzles');

      await fireEvent.press(screen.getByTestId('tab-1y'));
      await act(async () => {});

      expect(getPuzzleStats).toHaveBeenLastCalledWith(
        'judit',
        '1y',
        'access-token',
      );
    });

    it('says when none were tried in all time', async () => {
      (getPuzzleStats as jest.Mock).mockResolvedValue(
        makePuzzleStats({
          period: 'all',
          history: [],
          highest: null,
          lowest: null,
          ratingChange: null,
        }),
      );
      const { screen } = await renderScreen('puzzles');

      expect(screen.getByTestId('rating-chart-empty')).toHaveTextContent(
        /No puzzles tried/,
      );
      expect(screen.getByTestId('rating-highest')).toHaveTextContent(
        /No puzzles tried/,
      );
    });
  });
});

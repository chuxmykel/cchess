import { act, fireEvent, render } from '@testing-library/react-native';

import RatingStats from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getRatingStats } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
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
}));

describe('RatingStats', () => {
  async function renderScreen() {
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
            category: 'blitz',
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

  it('says there is nothing to chart without rated games', async () => {
    (getRatingStats as jest.Mock).mockResolvedValue(
      makeRatingStats({
        history: [],
        highest: null,
        lowest: null,
        ratingChange: null,
      }),
    );

    const { screen } = await renderScreen();

    expect(screen.getByTestId('rating-chart-empty')).toBeTruthy();
    expect(screen.queryByTestId('rating-stats-change')).toBeNull();
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
});

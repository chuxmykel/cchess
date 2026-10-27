import { fireEvent, render, within } from '@testing-library/react-native';

import RecentGamesList from '.';
import { RECENT_GAMES_STATUS } from '../../hooks/useRecentGames';
import { makeGameSummary } from '../../testUtils/gameSummary';

const NOW = new Date('2026-10-26T12:00:00.000Z');

describe('RecentGamesList', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows placeholder rows while loading', async () => {
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.LOADING }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByTestId('recent-games-loading')).toBeTruthy();
  });

  it('shows the games in the order given', async () => {
    const games = [
      makeGameSummary({ id: 'newest' }),
      makeGameSummary({ id: 'older' }),
    ];
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games }}
        onRetry={jest.fn()}
      />,
    );

    expect(
      screen.getAllByTestId(/^game-row-/).map((row) => row.props.testID),
    ).toEqual(['game-row-newest', 'game-row-older']);
  });

  it('shows the opponent, when the game ended, and the result', async () => {
    const game = makeGameSummary({
      opponentDisplayName: 'Judit Polgar',
      endedAt: '2026-10-26T10:00:00.000Z',
      result: 'loss',
    });
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [game] }}
        onRetry={jest.fn()}
      />,
    );

    const row = within(screen.getByTestId(`game-row-${game.id}`));
    expect(row.getByText('Judit Polgar')).toBeTruthy();
    expect(row.getByText('2 hours ago')).toBeTruthy();
    expect(row.getByTestId('game-result-icon-loss')).toBeTruthy();
  });

  it("shows the opponent's rating and what the game did to mine", async () => {
    const game = makeGameSummary({ opponentRating: 1529, ratingDiff: -8 });
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [game] }}
        onRetry={jest.fn()}
      />,
    );

    const row = within(screen.getByTestId(`game-row-${game.id}`));
    expect(row.getByText('1529', { exact: false })).toBeTruthy();
    expect(row.getByTestId('game-row-rating-diff')).toHaveTextContent(
      '\u22128',
    );
  });

  it('shows neither for a game without ratings', async () => {
    const game = makeGameSummary();
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [game] }}
        onRetry={jest.fn()}
      />,
    );

    const row = within(screen.getByTestId(`game-row-${game.id}`));
    expect(row.getByText('Judit Polgar')).toHaveTextContent('Judit Polgar', {
      exact: true,
    });
    expect(row.queryByTestId('game-row-rating-diff')).toBeNull();
  });

  it('marks an aborted game, which has no result', async () => {
    const game = makeGameSummary({
      status: 'aborted',
      result: null,
      endedAt: '2026-10-26T11:55:00.000Z',
    });
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [game] }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('Aborted • 5 minutes ago')).toBeTruthy();
    expect(screen.queryByTestId(/^game-result-icon-/)).toBeNull();
  });

  it("never says a game ends in the future when the server's clock is ahead", async () => {
    const game = makeGameSummary({ endedAt: '2026-10-26T12:00:03.000Z' });
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [game] }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('0 seconds ago')).toBeTruthy();
  });

  it('says where games will appear when there are none yet', async () => {
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.READY, games: [] }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('Your games will show here.')).toBeTruthy();
  });

  it('offers to try again when the games failed to load', async () => {
    const onRetry = jest.fn();
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.ERROR }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Couldn't load your games.")).toBeTruthy();
    await fireEvent.press(screen.getByTestId('recent-games-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a 'Recent Games' section header with a 'See All' action", async () => {
    const screen = await render(
      <RecentGamesList
        recentGames={{ status: RECENT_GAMES_STATUS.LOADING }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('Recent Games')).toBeTruthy();
    expect(screen.getByTestId('recent-games-see-all')).toBeTruthy();
  });
});

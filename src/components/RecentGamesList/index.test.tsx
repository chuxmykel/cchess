import { render } from '@testing-library/react-native';

import RecentGamesList from '.';
import { RECENT_GAMES } from '../../constants/recentGames';

describe('RecentGamesList', () => {
  it('caps the games shown at 10, even though more exist', async () => {
    expect(RECENT_GAMES.length).toBeGreaterThan(10);

    const screen = await render(<RecentGamesList />);

    expect(screen.getAllByTestId(/^game-row-/)).toHaveLength(10);
  });

  it('renders the games in the order they appear in RECENT_GAMES', async () => {
    const screen = await render(<RecentGamesList />);

    const rows = screen.getAllByTestId(/^game-row-/);
    const renderedIds = rows.map((row) => row.props.testID);
    const expectedIds = RECENT_GAMES.slice(0, 10).map(
      (game) => `game-row-${game.id}`,
    );

    expect(renderedIds).toEqual(expectedIds);
  });

  it("renders a 'Recent Games' section header with a 'See All' action", async () => {
    const screen = await render(<RecentGamesList />);

    expect(screen.getByText('Recent Games')).toBeTruthy();
    expect(screen.getByText('See All')).toBeTruthy();
    expect(screen.getByTestId('recent-games-see-all')).toBeTruthy();
  });
});

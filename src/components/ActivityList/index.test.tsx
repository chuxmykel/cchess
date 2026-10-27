import { render, within } from '@testing-library/react-native';

import ActivityList from '.';
import { ActivityDay } from '../../network/restClient';

function day(overrides: Partial<ActivityDay>): ActivityDay {
  return {
    date: '2026-10-27',
    category: 'bullet',
    games: 45,
    wins: 24,
    draws: 3,
    losses: 18,
    ratingAfter: 2524,
    ratingDiff: 12,
    ...overrides,
  };
}

describe('ActivityList', () => {
  it("shows each day's games, results and rating change", async () => {
    const screen = await render(
      <ActivityList
        emptyMessage=""
        activity={[
          day({}),
          day({ category: 'blitz', games: 1, wins: 1, draws: 0, losses: 0 }),
          day({
            date: '2026-10-26',
            games: 2,
            ratingAfter: null,
            ratingDiff: null,
          }),
        ]}
      />,
    );

    expect(screen.getByText('Oct 27, 2026')).toBeTruthy();
    expect(screen.getByText('Oct 26, 2026')).toBeTruthy();
    const bullet = within(screen.getByTestId('activity-2026-10-27-bullet'));
    expect(bullet.getByText('Played 45 Bullet games')).toBeTruthy();
    expect(bullet.getByText('2524')).toBeTruthy();
    expect(bullet.getByText('24')).toBeTruthy();
    expect(bullet.getByText('18')).toBeTruthy();
    expect(screen.getByText('Played 1 Blitz game')).toBeTruthy();
  });

  it('says when there were no games', async () => {
    const screen = await render(
      <ActivityList
        activity={[]}
        emptyMessage="Judit's games will show here."
      />,
    );

    expect(screen.getByTestId('activity-empty')).toBeTruthy();
    expect(screen.getByText("Judit's games will show here.")).toBeTruthy();
  });
});

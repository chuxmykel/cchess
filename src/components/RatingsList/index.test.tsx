import { render, within } from '@testing-library/react-native';

import RatingsList from '.';

describe('RatingsList', () => {
  it('lists every category, in order from fastest to slowest', async () => {
    const screen = await render(<RatingsList ratings={[]} />);

    expect(
      screen.getAllByTestId(/^rating-/).map((row) => row.props.testID),
    ).toEqual([
      'rating-bullet',
      'rating-blitz',
      'rating-rapid',
      'rating-classical',
    ]);
  });

  it('shows the rating and games played for a category with games', async () => {
    const screen = await render(
      <RatingsList
        ratings={[
          {
            category: 'blitz',
            rating: 1516,
            gamesPlayed: 3,
            provisional: false,
          },
        ]}
      />,
    );

    const blitz = within(screen.getByTestId('rating-blitz'));
    expect(blitz.getByText('Blitz')).toBeTruthy();
    expect(blitz.getByText('3 games')).toBeTruthy();
    expect(blitz.getByText('1516')).toBeTruthy();
  });

  it('says a single game in the singular', async () => {
    const screen = await render(
      <RatingsList
        ratings={[
          {
            category: 'rapid',
            rating: 1520,
            gamesPlayed: 1,
            provisional: false,
          },
        ]}
      />,
    );

    expect(
      within(screen.getByTestId('rating-rapid')).getByText('1 game'),
    ).toBeTruthy();
  });

  it('marks a category with no games yet', async () => {
    const screen = await render(<RatingsList ratings={[]} />);

    const bullet = within(screen.getByTestId('rating-bullet'));
    expect(bullet.getByText('No games yet')).toBeTruthy();
    expect(bullet.getByText('—')).toBeTruthy();
  });

  it('marks a provisional rating with a question mark', async () => {
    const screen = await render(
      <RatingsList
        ratings={[
          {
            category: 'blitz',
            rating: 1662,
            gamesPlayed: 1,
            provisional: true,
          },
        ]}
      />,
    );

    expect(
      within(screen.getByTestId('rating-blitz')).getByText('1662?'),
    ).toBeTruthy();
  });
});

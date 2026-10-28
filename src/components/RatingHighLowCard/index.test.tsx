import { render } from '@testing-library/react-native';

import RatingHighLowCard from '.';

describe('RatingHighLowCard', () => {
  it('shows the highest and lowest rating and when each was reached', async () => {
    const screen = await render(
      <RatingHighLowCard
        highest={{ at: '2026-10-20T18:00:00.000Z', rating: 1670 }}
        lowest={{ at: '2026-10-01T10:10:00.000Z', rating: 1641 }}
      />,
    );

    expect(screen.getByTestId('rating-highest')).toHaveTextContent(
      'Highest rating1670Oct 20, 2026',
    );
    expect(screen.getByTestId('rating-lowest')).toHaveTextContent(
      'Lowest rating1641Oct 1, 2026',
    );
  });

  it('says there were no rated games without any', async () => {
    const screen = await render(
      <RatingHighLowCard highest={null} lowest={null} />,
    );

    expect(screen.getAllByText('No rated games')).toHaveLength(2);
  });
});

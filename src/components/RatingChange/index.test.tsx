import { render } from '@testing-library/react-native';

import RatingChange from '.';

describe('RatingChange', () => {
  it('shows points gained beside a green up arrow', async () => {
    const screen = await render(<RatingChange change={12} testID="change" />);

    expect(screen.getByText('12')).toHaveStyle({ color: '#4caf50' });
    expect(screen.getByTestId('change-arrow').props.name).toBe('arrow-up-bold');
    expect(screen.getByLabelText('Up 12 points')).toHaveStyle({
      transform: [{ skewX: '-12deg' }],
    });
  });

  it('shows points lost beside a red down arrow', async () => {
    const screen = await render(<RatingChange change={-8} testID="change" />);

    expect(screen.getByText('8')).toHaveStyle({ color: '#e53935' });
    expect(screen.getByTestId('change-arrow').props.name).toBe(
      'arrow-down-bold',
    );
  });

  it('shows no arrow when the rating ended where it started', async () => {
    const screen = await render(<RatingChange change={0} testID="change" />);

    expect(screen.getByText('±0')).toBeTruthy();
    expect(screen.queryByTestId('change-arrow')).toBeNull();
  });
});

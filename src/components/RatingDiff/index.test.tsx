import { render } from '@testing-library/react-native';

import RatingDiff from '.';
import { lightTheme } from '../../theme';

const { colors } = lightTheme;

describe('RatingDiff', () => {
  it.each([
    [12, '+12', colors.ratingUp],
    [-12, '−12', colors.ratingDown],
    [0, '±0', colors.ratingEven],
  ])('shows %i as %s', async (diff, text, color) => {
    const screen = await render(<RatingDiff diff={diff} testID="diff" />);

    const label = screen.getByTestId('diff');
    expect(label).toHaveTextContent(text);
    expect(label).toHaveStyle({ color });
  });
});

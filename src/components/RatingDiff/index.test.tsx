import { render } from '@testing-library/react-native';

import RatingDiff from '.';

describe('RatingDiff', () => {
  it.each([
    [12, '+12', '#4caf50'],
    [-12, '−12', '#e53935'],
    [0, '±0', '#888'],
  ])('shows %i as %s', async (diff, text, color) => {
    const screen = await render(<RatingDiff diff={diff} testID="diff" />);

    const label = screen.getByTestId('diff');
    expect(label).toHaveTextContent(text);
    expect(label).toHaveStyle({ color });
  });
});

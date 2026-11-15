import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import SquareBadges from '.';

describe('SquareBadges', () => {
  const boardWidth = 400;

  it('draws nothing without badges', async () => {
    const screen = await render(
      <SquareBadges badges={[]} boardWidth={boardWidth} />,
    );

    expect(screen.queryByTestId('square-badges')).toBeNull();
  });

  it("sits on the square's top-right corner, its content inside", async () => {
    const screen = await render(
      <SquareBadges
        badges={[{ square: 'e4', color: 'green', content: <Text>!</Text> }]}
        boardWidth={boardWidth}
      />,
    );

    const badge = screen.getByTestId('square-badge-e4');
    // e4's square runs from x 200 to 250 and y 200 to 250; the badge is 21
    // across, standing 30% of itself over the corner.
    expect(badge).toHaveStyle({
      left: 250 - 21 * 0.7,
      top: 200 - 21 * 0.3,
      backgroundColor: 'green',
    });
    expect(screen.getByText('!')).toBeTruthy();
  });

  it('keeps a badge on the board at its edge', async () => {
    const screen = await render(
      <SquareBadges
        badges={[{ square: 'h8', color: 'red' }]}
        boardWidth={boardWidth}
      />,
    );

    expect(screen.getByTestId('square-badge-h8')).toHaveStyle({
      left: 400 - 21,
      top: 0,
    });
  });

  it("turns with the board for black's side", async () => {
    const screen = await render(
      <SquareBadges
        badges={[{ square: 'a1', color: 'red' }]}
        boardWidth={boardWidth}
        orientation="b"
      />,
    );

    // a1 is top right from black's side.
    expect(screen.getByTestId('square-badge-a1')).toHaveStyle({
      left: 400 - 21,
      top: 0,
    });
  });
});

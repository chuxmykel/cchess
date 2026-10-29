import { render } from '@testing-library/react-native';

import LastMoveHighlight from '.';

describe('LastMoveHighlight', () => {
  const squareWidth = 50;

  it('marks the square a move left and the one it reached', async () => {
    const screen = await render(
      <LastMoveHighlight
        move={{ from: 'e2', to: 'e4' }}
        squareWidth={squareWidth}
      />,
    );

    expect(screen.getByTestId('last-move-from')).toHaveStyle({
      left: 4 * squareWidth,
      top: 6 * squareWidth,
      width: squareWidth,
      height: squareWidth,
    });
    expect(screen.getByTestId('last-move-to')).toHaveStyle({
      left: 4 * squareWidth,
      top: 4 * squareWidth,
    });
  });

  it("marks them from black's side", async () => {
    const screen = await render(
      <LastMoveHighlight
        move={{ from: 'e2', to: 'e4' }}
        squareWidth={squareWidth}
        orientation="b"
      />,
    );

    expect(screen.getByTestId('last-move-from')).toHaveStyle({
      left: 3 * squareWidth,
      top: 1 * squareWidth,
    });
  });

  it('marks nothing before the first move', async () => {
    const screen = await render(
      <LastMoveHighlight move={null} squareWidth={squareWidth} />,
    );

    expect(screen.queryByTestId('last-move-from')).toBeNull();
    expect(screen.queryByTestId('last-move-to')).toBeNull();
  });
});

import { render } from '@testing-library/react-native';

import BoardArrows from '.';

describe('BoardArrows', () => {
  const boardWidth = 400;
  const arrow = {
    from: 'e2' as const,
    to: 'e4' as const,
    color: 'green',
    weight: 0.15,
  };

  it('draws nothing without arrows', async () => {
    const screen = await render(
      <BoardArrows arrows={[]} boardWidth={boardWidth} />,
    );

    expect(screen.queryByTestId('board-arrows')).toBeNull();
  });

  it("starts an arrow at its square's centre, from white's side", async () => {
    const screen = await render(
      <BoardArrows arrows={[arrow]} boardWidth={boardWidth} />,
    );

    expect(screen.getByTestId('arrow-e2e4').props).toMatchObject({
      x1: 225,
      y1: 325,
      x2: 225,
    });
  });

  it("starts it from black's side when the board is turned", async () => {
    const screen = await render(
      <BoardArrows arrows={[arrow]} boardWidth={boardWidth} orientation="b" />,
    );

    expect(screen.getByTestId('arrow-e2e4').props).toMatchObject({
      x1: 175,
      y1: 75,
    });
  });
});

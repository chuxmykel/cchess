import { fireEvent, render } from '@testing-library/react-native';

import BoardSurface from '.';

describe('BoardSurface', () => {
  const colors = { light: 'white', dark: 'black' };

  it('should exist', () => {
    expect(BoardSurface).toBeDefined();
  });

  it('renders all 8 rows of the board', async () => {
    const screen = await render(
      <BoardSurface colors={colors} onSquarePress={jest.fn()} />,
    );

    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
  });

  it("calls onSquarePress with the pressed square's notation", async () => {
    const onSquarePress = jest.fn();
    const screen = await render(
      <BoardSurface colors={colors} onSquarePress={onSquarePress} />,
    );

    // Top-left square is rank 8, bottom-right is rank 1 - the board is
    // rendered from black's back rank down to white's.
    await fireEvent.press(screen.getByTestId('square-a8'));
    await fireEvent.press(screen.getByTestId('square-h1'));

    expect(onSquarePress).toHaveBeenNthCalledWith(1, 'a8');
    expect(onSquarePress).toHaveBeenNthCalledWith(2, 'h1');
  });
});

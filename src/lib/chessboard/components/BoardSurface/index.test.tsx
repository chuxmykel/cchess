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

    await fireEvent.press(screen.getByTestId('square-a8'));
    await fireEvent.press(screen.getByTestId('square-h1'));

    expect(onSquarePress).toHaveBeenNthCalledWith(1, 'a8');
    expect(onSquarePress).toHaveBeenNthCalledWith(2, 'h1');
  });

  it("renders rank 8 at the top from white's perspective", async () => {
    const screen = await render(
      <BoardSurface colors={colors} onSquarePress={jest.fn()} />,
    );
    const rows = screen.getAllByTestId('chessboard-row') as any[];

    expect(rows[0].children[0].props.testID).toBe('square-a8');
    expect(rows[7].children[0].props.testID).toBe('square-a1');
  });

  it("renders rank 1 at the top from black's perspective", async () => {
    const screen = await render(
      <BoardSurface
        colors={colors}
        orientation="b"
        onSquarePress={jest.fn()}
      />,
    );
    const rows = screen.getAllByTestId('chessboard-row') as any[];

    expect(rows[0].children[0].props.testID).toBe('square-h1');
    expect(rows[7].children[0].props.testID).toBe('square-h8');
  });

  it('can be rendered display-only, with no square press handler', async () => {
    const screen = await render(<BoardSurface colors={colors} />);

    await fireEvent.press(screen.getByTestId('square-e4'));

    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
  });
});

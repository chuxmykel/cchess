import { fireEvent, render } from '@testing-library/react-native';

import Row from '.';

describe('Row', () => {
  const colors = { light: 'white', dark: 'black' };

  async function renderChessBoardRow(onSquarePress?: (square: string) => void) {
    const screen = await render(
      <Row colors={colors} rank={1} onSquarePress={onSquarePress} />,
    );
    const result = screen.getByTestId('chessboard-row');
    return { result, screen };
  }

  // a1 is a dark square and h1 a light one whichever way the board faces -
  // each square is colored by what it is, not where it's drawn.
  function expectRank1ColoredBySquare(
    screen: Awaited<ReturnType<typeof render>>,
  ) {
    expect(screen.getByTestId('square-a1').props.style.backgroundColor).toBe(
      colors.dark,
    );
    expect(screen.getByTestId('square-h1').props.style.backgroundColor).toBe(
      colors.light,
    );
  }

  it('should exist', () => {
    expect(Row).toBeDefined();
  });

  it('should have 8 columns', async () => {
    const { result } = await renderChessBoardRow();
    expect(result.children).toHaveLength(8);
  });

  it("should call onSquarePress with the pressed square's notation", async () => {
    const onSquarePress = jest.fn();
    const { screen } = await renderChessBoardRow(onSquarePress);

    await fireEvent.press(screen.getByTestId('square-a1'));
    await fireEvent.press(screen.getByTestId('square-h1'));

    expect(onSquarePress).toHaveBeenNthCalledWith(1, 'a1');
    expect(onSquarePress).toHaveBeenNthCalledWith(2, 'h1');
  });

  describe("from white's perspective", () => {
    it('runs the files a -> h, colored by the square itself', async () => {
      const screen = await render(<Row colors={colors} rank={1} />);
      const squares = screen.getByTestId('chessboard-row').children as any[];

      expect(squares[0].props.testID).toBe('square-a1');
      expect(squares[7].props.testID).toBe('square-h1');
      expectRank1ColoredBySquare(screen);
    });

    it('labels the rank on the a-file and the files along rank 1', async () => {
      const rank1 = await render(<Row colors={colors} rank={1} />);
      expect(rank1.getByText('1')).toBeTruthy();
      expect(rank1.getByText('a')).toBeTruthy();
      expect(rank1.getByText('h')).toBeTruthy();

      const rank8 = await render(<Row colors={colors} rank={8} />);
      expect(rank8.queryByText('a')).toBeNull();
    });
  });

  describe("from black's perspective", () => {
    it('runs the files h -> a, colored by the square itself', async () => {
      const screen = await render(
        <Row colors={colors} rank={1} orientation="b" />,
      );
      const squares = screen.getByTestId('chessboard-row').children as any[];

      expect(squares[0].props.testID).toBe('square-h1');
      expect(squares[7].props.testID).toBe('square-a1');
      expectRank1ColoredBySquare(screen);
    });

    it('labels the rank on the h-file and the files along rank 8', async () => {
      const rank8 = await render(
        <Row colors={colors} rank={8} orientation="b" />,
      );
      expect(rank8.getByText('8')).toBeTruthy();
      expect(rank8.getByText('h')).toBeTruthy();
      expect(rank8.getByText('a')).toBeTruthy();

      const rank1 = await render(
        <Row colors={colors} rank={1} orientation="b" />,
      );
      expect(rank1.queryByText('a')).toBeNull();
    });
  });
});

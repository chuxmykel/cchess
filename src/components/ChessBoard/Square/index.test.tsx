import { fireEvent, render } from '@testing-library/react-native';

import Square from '.';

describe('Square', () => {
  const colors = { light: 'white', dark: 'black' };

  function renderChessBoardSquareWithCoordinates(onPress?: () => void) {
    return render(
      <Square colors={colors} rank={1} file={'a'} onPress={onPress} />,
    );
  }

  function renderChessBoardSquareWithoutCoordinates() {
    return render(<Square colors={colors} rank={2} file={'b'} />);
  }

  it('should exist', () => {
    expect(Square).toBeDefined();
  });

  describe("from white's perspective", () => {
    it("should display coordinates if it's an a file square", async () => {
      const screen = await renderChessBoardSquareWithCoordinates();
      const squareWithCoordinate = screen.getByText('a');

      expect(squareWithCoordinate).toBeDefined();
    });

    it("should display coordinates if it's a rank 1 square", async () => {
      const screen = await renderChessBoardSquareWithCoordinates();
      const squareWithCoordinate = screen.getByText('1');

      expect(squareWithCoordinate).toBeDefined();
    });

    it("should not display coordinates if it's not a rank 1 square", async () => {
      const screen = await renderChessBoardSquareWithoutCoordinates();
      expect(() => screen.getByText('2')).toThrow(
        'Unable to find an element with text: 2',
      );
    });

    it("should not display coordinates if it's not an a file square", async () => {
      const screen = await renderChessBoardSquareWithoutCoordinates();
      expect(() => screen.getByText('b')).toThrow(
        'Unable to find an element with text: b',
      );
    });
  });

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    const screen = await renderChessBoardSquareWithCoordinates(onPress);
    await fireEvent.press(screen.getByTestId('square-a1'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a1', 'black', 'white'],
    ['h1', 'white', 'black'],
    ['h8', 'black', 'white'],
    ['e4', 'white', 'black'],
  ])(
    'colors %s by the square itself, with contrasting labels',
    async (square, background, labelColor) => {
      const file = square[0];
      const rank = Number(square[1]);
      const screen = await render(
        <Square colors={colors} rank={rank} file={file} />,
      );

      expect(
        screen.getByTestId(`square-${square}`).props.style.backgroundColor,
      ).toBe(background);
      // Only edge squares show their labels, so include hidden ones - the
      // color is set either way.
      const rankLabel = screen.getByText(String(rank), {
        includeHiddenElements: true,
      });
      expect(rankLabel.props.style.color).toBe(labelColor);
    },
  );

  describe("from black's perspective", () => {
    function renderSquare(file: string, rank: number) {
      return render(
        <Square colors={colors} rank={rank} file={file} orientation="b" />,
      );
    }

    it('shows the rank on an h-file square', async () => {
      const screen = await renderSquare('h', 2);
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('does not show the rank on an a-file square', async () => {
      const screen = await renderSquare('a', 2);
      expect(screen.queryByText('2')).toBeNull();
    });

    it('shows the file on a rank 8 square', async () => {
      const screen = await renderSquare('b', 8);
      expect(screen.getByText('b')).toBeTruthy();
    });

    it("keeps the same square color as from white's perspective", async () => {
      const screen = await renderSquare('a', 1);
      expect(screen.getByTestId('square-a1').props.style.backgroundColor).toBe(
        'black',
      );
    });

    it('does not show the file on a rank 1 square', async () => {
      const screen = await renderSquare('b', 1);
      expect(screen.queryByText('b')).toBeNull();
    });
  });
});

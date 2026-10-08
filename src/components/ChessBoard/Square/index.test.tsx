import { fireEvent, render } from '@testing-library/react-native';

import Square from '.';

describe('Square', () => {
  function renderChessBoardSquareWithCoordinates(onPress?: () => void) {
    return render(
      <Square
        color="black"
        textColor="white"
        rank={1}
        file={'a'}
        onPress={onPress}
      />,
    );
  }

  function renderChessBoardSquareWithoutCoordinates() {
    return render(
      <Square color="black" textColor="white" rank={2} file={'b'} />,
    );
  }

  it('should exist', () => {
    expect(Square).toBeDefined();
  });

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

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    const screen = await renderChessBoardSquareWithCoordinates(onPress);
    await fireEvent.press(screen.getByTestId('square-a1'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

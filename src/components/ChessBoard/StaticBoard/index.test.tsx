import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { DEFAULT_POSITION } from 'chess.js';

import StaticBoard from '.';
import { NUMBER_OF_ROWS } from '../../../constants';

describe('StaticBoard', () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const colors = { light: 'white', dark: 'black' };
  const KINGS_AND_E4_PAWN = '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1';

  function translateOf(element: { props: Record<string, any> }) {
    const [{ translateX }, { translateY }] = StyleSheet.flatten(
      element.props.style,
    ).transform as [{ translateX: number }, { translateY: number }];
    return { x: translateX, y: translateY };
  }

  it('draws every piece in the position', async () => {
    const screen = await render(
      <StaticBoard fen={DEFAULT_POSITION} colors={colors} width={width} />,
    );

    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
  });

  it('places pieces on their squares from the given side', async () => {
    const fromWhite = await render(
      <StaticBoard fen={KINGS_AND_E4_PAWN} colors={colors} width={width} />,
    );
    expect(translateOf(fromWhite.getByTestId('piece-e1'))).toEqual({
      x: 4 * PIECE_WIDTH,
      y: 7 * PIECE_WIDTH,
    });

    const fromBlack = await render(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        orientation="b"
      />,
    );
    expect(translateOf(fromBlack.getByTestId('piece-e1'))).toEqual({
      x: 3 * PIECE_WIDTH,
      y: 0,
    });
  });

  it('keeps the same element for a piece that stays put when the position changes', async () => {
    const screen = await render(
      <StaticBoard fen={KINGS_AND_E4_PAWN} colors={colors} width={width} />,
    );
    const whiteKing = screen.getByTestId('piece-e1');

    await screen.rerender(
      <StaticBoard
        fen="4k3/8/8/4P3/8/8/8/4K3 b - - 0 1"
        colors={colors}
        width={width}
      />,
    );

    expect(screen.getByTestId('piece-e1')).toBe(whiteKing);
    expect(screen.getByTestId('piece-e5')).toBeTruthy();
    expect(screen.queryByTestId('piece-e4')).toBeNull();
  });
});

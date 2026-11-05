import { render } from '@testing-library/react-native';

import ChessPiece, { silhouette } from '.';
import { defaultPieceSet } from '../../defaultPieceSet';
import { PieceSet } from '../../types';

describe('ChessPiece', () => {
  it('draws a piece from the board’s own set', async () => {
    const screen = await render(
      <ChessPiece piece="bq" size={30} testID="queen" />,
    );

    expect(screen.getByTestId('queen')).toHaveProp('xml', defaultPieceSet.bq);
    expect(screen.getByTestId('queen')).toHaveProp('width', 30);
  });

  it('draws a piece from the set given', async () => {
    const pieceSet = { ...defaultPieceSet, wn: '<svg id="wn"/>' } as PieceSet;
    const screen = await render(
      <ChessPiece piece="wn" size={30} pieceSet={pieceSet} testID="knight" />,
    );

    expect(screen.getByTestId('knight')).toHaveProp('xml', '<svg id="wn"/>');
  });

  it('draws a piece in one color, given one', async () => {
    const screen = await render(
      <ChessPiece piece="bp" size={16} color="grey" testID="pawn" />,
    );

    expect(screen.getByTestId('pawn')).toHaveProp(
      'xml',
      silhouette(defaultPieceSet.bp, 'grey'),
    );
  });
});

describe('silhouette', () => {
  it('makes every fill and stroke one color, leaving none as it is', () => {
    expect(
      silhouette(
        '<g fill="#fff" stroke="#111"><path fill="none" stroke="#e9e9e9"/></g>',
        'grey',
      ),
    ).toBe(
      '<g fill="grey" stroke="grey"><path fill="none" stroke="grey"/></g>',
    );
  });
});

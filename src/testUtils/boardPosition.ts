import { StyleSheet } from 'react-native';

import { animatedStyleOf } from './animatedValue';

type Element = { props: Record<string, any> };

// Where a board piece is drawn on screen: its position from white's side,
// turned round with the pieces layer when the board faces black (see
// Chessboard). Both elements by testID: `piece-<square>` and `pieces-layer`.
export function piecePositionOnScreen(
  piece: Element,
  piecesLayer: Element,
  squareWidth: number,
) {
  const [{ translateX: x }, { translateY: y }] =
    animatedStyleOf(piece).transform;
  const turned = (StyleSheet.flatten(piecesLayer.props.style).transform ?? [])
    .map((step: Record<string, unknown>) => step.rotate)
    .includes('180deg');
  if (!turned) return { x, y };
  const lastSquare = 7 * squareWidth;
  return { x: lastSquare - x, y: lastSquare - y };
}

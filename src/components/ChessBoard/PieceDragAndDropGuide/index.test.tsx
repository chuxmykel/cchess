import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import PieceDragAndDropGuide from '.';
import { getAnimatedValue } from '../../../testUtils/animatedValue';

describe('PieceDragAndDropGuide', () => {
  const boardWidth = 400;
  const squareWidth = 50;

  async function renderGuide(
    overrides: Partial<{
      position: Animated.ValueXY;
      opacity: Animated.Value;
    }> = {},
  ) {
    const position =
      overrides.position ?? new Animated.ValueXY({ x: 123, y: 45 });
    const opacity = overrides.opacity ?? new Animated.Value(0.7);
    const screen = await render(
      <PieceDragAndDropGuide
        boardWidth={boardWidth}
        squareWidth={squareWidth}
        position={position}
        opacity={opacity}
      />,
    );
    return { guide: screen.getByTestId('drag-guide'), position, opacity };
  }

  it('should exist', () => {
    expect(PieceDragAndDropGuide).toBeDefined();
  });

  it('sizes the guide relative to a square, centered on the piece', async () => {
    const { guide } = await renderGuide();

    const diameter = squareWidth * 2.5;
    expect(guide.props.style.width).toBe(diameter);
    expect(guide.props.style.height).toBe(diameter);
    expect(guide.props.style.borderRadius).toBe(diameter / 2);
    expect(guide.props.style.top).toBe(-(diameter / 3.5));
    expect(guide.props.style.left).toBe(-(diameter / 3.5));
  });

  it('wires opacity and position to the given Animated values', async () => {
    const { guide, position, opacity } = await renderGuide();

    expect(guide.props.style.opacity).toBe(getAnimatedValue(opacity));
    expect(guide.props.style.transform).toEqual([
      { translateX: getAnimatedValue(position.x) },
      { translateY: getAnimatedValue(position.y) },
    ]);
  });
});

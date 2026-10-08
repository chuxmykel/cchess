import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import ValidMoveIndicator from '.';
import { getAnimatedValue } from '../../../../testUtils/animatedValue';

describe('ValidMoveIndicator', () => {
  const squareWidth = 60;

  async function renderIndicator(
    overrides: Partial<{
      position: { x: number; y: number };
      opacity: Animated.Value;
    }> = {},
  ) {
    const position = overrides.position ?? { x: 120, y: 90 };
    const opacity = overrides.opacity ?? new Animated.Value(1);
    const screen = await render(
      <ValidMoveIndicator
        testID="valid-move-e4"
        position={position}
        squareWidth={squareWidth}
        opacity={opacity}
      />,
    );
    return {
      indicator: screen.getByTestId('valid-move-e4'),
      position,
      opacity,
    };
  }

  it('should exist', () => {
    expect(ValidMoveIndicator).toBeDefined();
  });

  it('sizes the dot relative to the square and centers it', async () => {
    const { indicator } = await renderIndicator();

    const diameter = squareWidth / 3;
    expect(indicator.props.style.width).toBe(diameter);
    expect(indicator.props.style.height).toBe(diameter);
    expect(indicator.props.style.borderRadius).toBe(diameter / 2);
    expect(indicator.props.style.top).toBe(diameter);
    expect(indicator.props.style.left).toBe(diameter);
  });

  it('wires opacity and position to the given Animated values', async () => {
    const { indicator, position, opacity } = await renderIndicator();

    expect(indicator.props.style.opacity).toBe(getAnimatedValue(opacity));
    expect(indicator.props.style.transform).toEqual([
      { translateX: position.x },
      { translateY: position.y },
    ]);
  });
});

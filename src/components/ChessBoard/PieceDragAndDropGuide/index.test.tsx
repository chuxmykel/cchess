import { render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import PieceDragAndDropGuide from '.';
import { DragGuide } from '../../../hooks/useDragGuide';
import { animatedStyleOf } from '../../../testUtils/animatedValue';

describe('PieceDragAndDropGuide', () => {
  const boardWidth = 400;
  const squareWidth = 50;

  async function renderGuide() {
    const guide: DragGuide = {
      x: makeMutable(123),
      y: makeMutable(45),
      opacity: makeMutable(0.7),
    };
    const screen = await render(
      <PieceDragAndDropGuide
        boardWidth={boardWidth}
        squareWidth={squareWidth}
        guide={guide}
      />,
    );
    return { element: screen.getByTestId('drag-guide'), guide };
  }

  it('should exist', () => {
    expect(PieceDragAndDropGuide).toBeDefined();
  });

  it('sizes the guide relative to a square, centered on the piece', async () => {
    const { element } = await renderGuide();

    const diameter = squareWidth * 2.5;
    expect(element).toHaveStyle({
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      top: -(diameter / 3.5),
      left: -(diameter / 3.5),
    });
  });

  it('draws the guide where its shared values say, as see-through as they say', async () => {
    const { element } = await renderGuide();

    expect(animatedStyleOf(element)).toMatchObject({
      opacity: 0.7,
      transform: [{ translateX: 123 }, { translateY: 45 }],
    });
  });
});

import { render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import PieceDragAndDropGuide from '.';
import { DragGuide } from '../../../hooks/useDragGuide';
import { animatedStyleOf } from '../../../testUtils/animatedValue';

describe('PieceDragAndDropGuide', () => {
  const boardWidth = 400;
  const squareWidth = 50;

  async function renderGuide(origin: { x: number; y: number } | null = null) {
    const guide: DragGuide = {
      x: makeMutable(123),
      y: makeMutable(45),
      opacity: makeMutable(0.7),
      origin: makeMutable<{ x: number; y: number } | null>(origin),
      taken: makeMutable(null),
    };
    const screen = await render(
      <PieceDragAndDropGuide
        boardWidth={boardWidth}
        squareWidth={squareWidth}
        guide={guide}
      />,
    );
    return {
      element: screen.getByTestId('drag-guide'),
      origin: screen.getByTestId('drag-origin'),
      guide,
    };
  }

  it('should exist', () => {
    expect(PieceDragAndDropGuide).toBeDefined();
  });

  it('sizes the guide two squares across, centered on its square', async () => {
    const { element } = await renderGuide();

    expect(element).toHaveStyle({
      width: 2 * squareWidth,
      height: 2 * squareWidth,
      borderRadius: squareWidth,
      top: -squareWidth / 2,
      left: -squareWidth / 2,
    });
  });

  it('marks the square a held piece came from', async () => {
    const { origin } = await renderGuide({ x: 150, y: 300 });

    expect(origin).toHaveStyle({ width: squareWidth, height: squareWidth });
    expect(animatedStyleOf(origin)).toMatchObject({
      opacity: 1,
      transform: [{ translateX: 150 }, { translateY: 300 }],
    });
  });

  it('marks no square when nothing is held', async () => {
    const { origin } = await renderGuide();

    expect(animatedStyleOf(origin).opacity).toBe(0);
  });

  it('draws the guide where its shared values say, as see-through as they say', async () => {
    const { element } = await renderGuide();

    expect(animatedStyleOf(element)).toMatchObject({
      opacity: 0.7,
      transform: [{ translateX: 123 }, { translateY: 45 }],
    });
  });
});

import { fireEvent, render } from '@testing-library/react-native';
import { PieceSymbol } from 'chess.js';

import PromotionMenu from '.';

describe('PromotionMenu', () => {
  async function renderPromotionMenu(
    handlePromotion = jest.fn(),
    onCancel = jest.fn(),
  ) {
    const screen = await render(
      <PromotionMenu
        boardWidth={400}
        pieceWidth={50}
        handlePromotion={handlePromotion}
        onCancel={onCancel}
        promotingColor="w"
      />,
    );
    return { screen, handlePromotion, onCancel };
  }

  it('should exist', () => {
    expect(PromotionMenu).toBeDefined();
  });

  it.each<PieceSymbol>(['q', 'r', 'b', 'n'])(
    "should call handlePromotion with '%s' when that option is pressed",
    async (type) => {
      const { screen, handlePromotion } = await renderPromotionMenu();

      await fireEvent.press(screen.getByTestId(`promote-${type}`));

      expect(handlePromotion).toHaveBeenCalledWith(type);
      expect(handlePromotion).toHaveBeenCalledTimes(1);
    },
  );

  it('should render the options in queen, rook, bishop, knight order', async () => {
    const { screen } = await renderPromotionMenu();

    const options = screen.getAllByTestId(/^promote-/);
    const order = options.map((option) => option.props.testID);

    expect(order).toEqual(['promote-q', 'promote-r', 'promote-b', 'promote-n']);
  });

  it('names each piece for screen readers', async () => {
    const { screen } = await renderPromotionMenu();

    expect(screen.getByLabelText('Queen')).toBeTruthy();
    expect(screen.getByLabelText('Knight')).toBeTruthy();
  });

  it('puts the pawn back when the board around it is tapped', async () => {
    const { screen, onCancel, handlePromotion } = await renderPromotionMenu();

    await fireEvent.press(screen.getByTestId('promotion-menu'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(handlePromotion).not.toHaveBeenCalled();
  });
});

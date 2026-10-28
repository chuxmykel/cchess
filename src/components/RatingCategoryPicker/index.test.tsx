import { fireEvent, render } from '@testing-library/react-native';

import RatingCategoryPicker from '.';

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

describe('RatingCategoryPicker', () => {
  it('names the category shown and ticks it in the menu', async () => {
    const screen = await render(
      <RatingCategoryPicker category="blitz" onSelect={jest.fn()} />,
    );

    expect(screen.getByTestId('rating-category-picker')).toHaveTextContent(
      /Blitz rating/,
    );
    expect(screen.getByTestId('rating-category-blitz')).toBeSelected();
    expect(screen.getByTestId('rating-category-rapid')).not.toBeSelected();
  });

  it('switches to another category, closing the menu', async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <RatingCategoryPicker category="blitz" onSelect={onSelect} />,
    );

    await fireEvent.press(screen.getByTestId('rating-category-rapid'));

    expect(onSelect).toHaveBeenCalledWith('rapid');
    expect(screen.queryByTestId('rating-category-rapid')).toBeNull();
  });

  it("doesn't switch to the category already shown", async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <RatingCategoryPicker category="blitz" onSelect={onSelect} />,
    );

    await fireEvent.press(screen.getByTestId('rating-category-blitz'));

    expect(onSelect).not.toHaveBeenCalled();
  });
});

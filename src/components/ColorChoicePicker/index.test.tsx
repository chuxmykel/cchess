import { fireEvent, render } from '@testing-library/react-native';

import ColorChoicePicker from '.';

describe('ColorChoicePicker', () => {
  it('marks the color chosen and picks another', async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <ColorChoicePicker selected="random" onSelect={onSelect} />,
    );

    expect(screen.getByTestId('color-random')).toBeSelected();
    expect(screen.getByTestId('color-white')).not.toBeSelected();
    await fireEvent.press(screen.getByTestId('color-black'));

    expect(onSelect).toHaveBeenCalledWith('black');
  });

  it('names each choice for screen readers', async () => {
    const screen = await render(
      <ColorChoicePicker selected="white" onSelect={jest.fn()} />,
    );

    expect(screen.getByLabelText('Play white')).toBeTruthy();
    expect(screen.getByLabelText('Play random')).toBeTruthy();
    expect(screen.getByLabelText('Play black')).toBeTruthy();
  });
});

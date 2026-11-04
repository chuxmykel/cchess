import { fireEvent, render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import NotchedSlider from '.';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

describe('NotchedSlider', () => {
  beforeEach(() => jest.mocked(Haptics.selectionAsync).mockClear());

  async function renderSlider() {
    const onValueChange = jest.fn();
    const screen = await render(
      <NotchedSlider
        minimumValue={0}
        maximumValue={3}
        step={1}
        value={1}
        onValueChange={onValueChange}
        testID="slider"
      />,
    );
    return { slider: screen.getByTestId('slider'), onValueChange };
  }

  it('notches the track at each step', async () => {
    const { slider } = await renderSlider();

    expect(slider.props.StepMarker).toBeDefined();
  });

  it('ticks as the thumb reaches each new step', async () => {
    const { slider, onValueChange } = await renderSlider();

    await fireEvent(slider, 'valueChange', 2);
    await fireEvent(slider, 'valueChange', 3);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    expect(onValueChange.mock.calls).toEqual([[2], [3]]);
  });

  it('stays still while the finger moves within a step', async () => {
    const { slider, onValueChange } = await renderSlider();

    await fireEvent(slider, 'valueChange', 1);
    await fireEvent(slider, 'valueChange', 2);
    await fireEvent(slider, 'valueChange', 2);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });
});

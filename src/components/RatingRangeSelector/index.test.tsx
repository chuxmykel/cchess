import { fireEvent, render } from '@testing-library/react-native';

import RatingRangeSelector from '.';

describe('RatingRangeSelector', () => {
  it('shows how far below and above your rating it reaches', async () => {
    const screen = await render(
      <RatingRangeSelector
        range={{ below: 200, above: 500 }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('rating-range-below')).toHaveTextContent('−200');
    expect(screen.getByTestId('rating-range-above')).toHaveTextContent('+500');
  });

  it('slides each side from 0 to 500 in steps of 50', async () => {
    const screen = await render(
      <RatingRangeSelector
        range={{ below: 200, above: 500 }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('rating-range-below-slider').props).toEqual(
      expect.objectContaining({
        minimumValue: 0,
        maximumValue: 500,
        step: 50,
      }),
    );
    expect(screen.getByTestId('rating-range-above-slider').props).toEqual(
      expect.objectContaining({
        minimumValue: 0,
        maximumValue: 500,
        step: 50,
      }),
    );
  });

  it('widens either side by sliding it right', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <RatingRangeSelector
        range={{ below: 200, above: 300 }}
        onChange={onChange}
      />,
    );

    await fireEvent(
      screen.getByTestId('rating-range-below-slider'),
      'valueChange',
      400,
    );
    expect(onChange).toHaveBeenLastCalledWith({ below: 400, above: 300 });

    await fireEvent(
      screen.getByTestId('rating-range-above-slider'),
      'valueChange',
      100,
    );
    expect(onChange).toHaveBeenLastCalledWith({ below: 200, above: 100 });
  });

  it('opens a side, and brings its last limit back', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <RatingRangeSelector
        range={{ below: 200, above: 300 }}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByTestId('rating-range-above-open'));
    expect(onChange).toHaveBeenLastCalledWith({ below: 200, above: null });

    await screen.rerender(
      <RatingRangeSelector
        range={{ below: 200, above: null }}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('rating-range-above')).toHaveTextContent('+∞');
    expect(screen.getByTestId('rating-range-above-open')).toBeChecked();
    expect(screen.getByTestId('rating-range-above-slider').props).toEqual(
      expect.objectContaining({ disabled: true, value: 300 }),
    );

    await fireEvent.press(screen.getByTestId('rating-range-above-open'));
    expect(onChange).toHaveBeenLastCalledWith({ below: 200, above: 300 });
  });

  it('starts an open side at the default limit when it is closed', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <RatingRangeSelector
        range={{ below: null, above: 300 }}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId('rating-range-below-open')).toBeChecked();
    await fireEvent.press(screen.getByTestId('rating-range-below-open'));

    expect(onChange).toHaveBeenLastCalledWith({ below: 500, above: 300 });
  });
});

import { fireEvent, render } from '@testing-library/react-native';

import DrawOfferPrompt from '.';

describe('DrawOfferPrompt', () => {
  it('accepts or declines the offer', async () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    const screen = await render(
      <DrawOfferPrompt onAccept={onAccept} onDecline={onDecline} />,
    );

    expect(screen.getByText('Your opponent offers a draw')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('accept-draw-button'));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('decline-draw-button'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

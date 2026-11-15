import { fireEvent, render } from '@testing-library/react-native';

import ReviewProgress from '.';

describe('ReviewProgress', () => {
  it('fills as far as the analysis has got', async () => {
    const screen = await render(
      <ReviewProgress progress={0.22} label="Analysing the game..." />,
    );

    expect(screen.getByText('22%')).toBeTruthy();
    expect(screen.getByTestId('review-progress-fill')).toHaveStyle({
      width: '22%',
    });
    expect(screen.queryByTestId('review-progress-retry')).toBeNull();
  });

  it('offers to try again when something went wrong', async () => {
    const onRetry = jest.fn();
    const screen = await render(
      <ReviewProgress
        progress={0}
        label="The engine couldn't start."
        onRetry={onRetry}
      />,
    );

    await fireEvent.press(screen.getByTestId('review-progress-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});

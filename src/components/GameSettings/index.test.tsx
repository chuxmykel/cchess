import { fireEvent, render } from '@testing-library/react-native';

import GameSettings from '.';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';

const RANGE = { below: 200, above: 500 };

describe('GameSettings', () => {
  function renderSettings({
    rated = true,
    canPlayRated = true,
    onChangeRated = jest.fn(),
    onChangeRatingRange = jest.fn(),
  } = {}) {
    return render(
      withSafeArea(
        <GameSettings
          rated={rated}
          ratingRange={RANGE}
          canPlayRated={canPlayRated}
          onChangeRated={onChangeRated}
          onChangeRatingRange={onChangeRatingRange}
        />,
      ),
    );
  }

  it('opens the settings in a sheet from the cog', async () => {
    const screen = await renderSettings();
    expect(screen.queryByTestId('rated-switch')).toBeNull();

    await fireEvent.press(screen.getByText('Game Settings'));

    expect(screen.getByTestId('rated-switch').props.value).toBe(true);
    expect(screen.getByTestId('rating-range-below')).toHaveTextContent('−200');
  });

  it('reports changes and stays open until Done', async () => {
    const onChangeRated = jest.fn();
    const onChangeRatingRange = jest.fn();
    const screen = await renderSettings({ onChangeRated, onChangeRatingRange });

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));
    await fireEvent(screen.getByTestId('rated-switch'), 'valueChange', false);
    await fireEvent(
      screen.getByTestId('rating-range-above-slider'),
      'valueChange',
      400,
    );

    expect(onChangeRated).toHaveBeenCalledWith(false);
    expect(onChangeRatingRange).toHaveBeenCalledWith({
      below: 200,
      above: 400,
    });
    expect(screen.getByTestId('rated-switch')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('game-settings-done'));
    await waitForSheetToClose();

    expect(screen.queryByTestId('rated-switch')).toBeNull();
  });

  it('offers guests casual games only, without a range', async () => {
    const screen = await renderSettings({ rated: false, canPlayRated: false });

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));

    expect(screen.getByTestId('rated-switch').props.value).toBe(false);
    expect(screen.getByText('Sign in to play rated games.')).toBeTruthy();
    expect(screen.queryByTestId('rating-range-below')).toBeNull();
  });

  it('tells a guest who switches Rated on to sign in, leaving it off', async () => {
    const onChangeRated = jest.fn();
    const screen = await renderSettings({
      rated: false,
      canPlayRated: false,
      onChangeRated,
    });

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));
    await fireEvent(screen.getByTestId('rated-switch'), 'valueChange', true);

    expect(screen.getAllByText('Sign in to play rated games.')).toHaveLength(2);
    expect(onChangeRated).not.toHaveBeenCalled();
    expect(screen.getByTestId('rated-switch').props.value).toBe(false);
  });

  it('shows no sign-in toast for a signed-in player', async () => {
    const screen = await renderSettings();

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));
    await fireEvent(screen.getByTestId('rated-switch'), 'valueChange', false);

    expect(screen.queryByText('Sign in to play rated games.')).toBeNull();
  });
});

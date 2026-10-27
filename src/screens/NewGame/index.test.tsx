import { fireEvent, render } from '@testing-library/react-native';

import NewGame from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { DEFAULT_RATING_RANGE } from '../../constants/seek';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

describe('NewGame', () => {
  function renderScreen({ isGuest }: { isGuest: boolean }) {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest } }),
    );
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(withSafeArea(<NewGame navigation={navigation} />)),
      navigation,
    };
  }

  it('seeks a rated game with the default range when signed in', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: false });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('start-new-game-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('LiveGame', {
      seek: {
        timeControl: DEFAULT_TIME_CONTROL,
        rated: true,
        ratingRange: DEFAULT_RATING_RANGE,
      },
    });
  });

  it('seeks a casual game as a guest', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: true });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('start-new-game-button'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'LiveGame',
      expect.objectContaining({
        seek: expect.objectContaining({ rated: false }),
      }),
    );
  });
});

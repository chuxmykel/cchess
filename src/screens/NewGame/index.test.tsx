import { fireEvent, render } from '@testing-library/react-native';

import NewGame from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { DEFAULT_RATING_RANGE } from '../../constants/seek';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
const mockSeekDailyGame = jest.fn();
jest.mock('../../hooks/useSeekDailyGame', () => ({
  useSeekDailyGame: () => mockSeekDailyGame,
}));

describe('NewGame', () => {
  function renderScreen({
    isGuest,
    daily,
  }: {
    isGuest: boolean;
    daily?: boolean;
  }) {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest } }),
    );
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(
        withSafeArea(
          <NewGame navigation={navigation} route={{ params: { daily } }} />,
        ),
      ),
      navigation,
    };
  }

  describe('a daily game', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('posts a seek and returns home to wait for an opponent there', async () => {
      mockSeekDailyGame.mockResolvedValue({ status: 'queued' });
      const { screenPromise, navigation } = renderScreen({
        isGuest: false,
        daily: true,
      });
      const screen = await screenPromise;

      expect(screen.getByText('Daily · 3 days')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('start-new-game-button'));

      expect(mockSeekDailyGame).toHaveBeenCalledWith({
        days: 3,
        rated: true,
        ratingRange: DEFAULT_RATING_RANGE,
        color: 'random',
      });
      expect(navigation.navigate).toHaveBeenCalledWith('Home');
    });

    it('opens the game when a seek was already waiting for it', async () => {
      mockSeekDailyGame.mockResolvedValue({
        status: 'matched',
        gameId: 'game-5',
      });
      const { screenPromise, navigation } = renderScreen({
        isGuest: false,
        daily: true,
      });
      const screen = await screenPromise;

      await fireEvent.press(screen.getByTestId('start-new-game-button'));

      expect(navigation.navigate).toHaveBeenCalledWith('DailyGame', {
        gameId: 'game-5',
      });
    });

    it("says why when the seek couldn't be posted", async () => {
      mockSeekDailyGame.mockRejectedValue(
        new Error('You can have at most 10 daily seeks waiting'),
      );
      const { screenPromise, navigation } = renderScreen({
        isGuest: false,
        daily: true,
      });
      const screen = await screenPromise;

      await fireEvent.press(screen.getByTestId('start-new-game-button'));

      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(
        screen.getByText('You can have at most 10 daily seeks waiting'),
      ).toBeTruthy();
    });
  });

  it('seeks a rated game with the default range when signed in', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: false });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('start-new-game-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('LiveGame', {
      seek: {
        timeControl: DEFAULT_TIME_CONTROL,
        rated: true,
        ratingRange: DEFAULT_RATING_RANGE,
        color: 'random',
      },
    });
  });

  it('seeks with the chosen mode, range and color', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: false });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));
    expect(screen.getByTestId('rated-switch').props.value).toBe(true);
    await fireEvent(screen.getByTestId('rated-switch'), 'valueChange', false);
    await fireEvent(
      screen.getByTestId('rating-range-below-slider'),
      'valueChange',
      400,
    );
    await fireEvent.press(screen.getByTestId('color-black'));
    await fireEvent.press(screen.getByTestId('game-settings-done'));
    await waitForSheetToClose();

    await fireEvent.press(screen.getByTestId('start-new-game-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('LiveGame', {
      seek: {
        timeControl: DEFAULT_TIME_CONTROL,
        rated: false,
        ratingRange: { ...DEFAULT_RATING_RANGE, below: 400 },
        color: 'black',
      },
    });
  });

  it('lets guests play casual games only, without a rating range', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: true });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('game-settings-trigger'));
    expect(screen.getByTestId('rated-switch').props.value).toBe(false);
    expect(screen.getByText('Sign in to play rated games.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('game-settings-done'));
    await waitForSheetToClose();

    await fireEvent.press(screen.getByTestId('start-new-game-button'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'LiveGame',
      expect.objectContaining({
        seek: expect.objectContaining({ rated: false }),
      }),
    );
  });

  it('opens Friends from Challenge a Friend', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: false });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('challenge-friend-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('Friends');
  });

  it('asks a guest to sign in before challenging friends', async () => {
    const { screenPromise, navigation } = renderScreen({ isGuest: true });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('challenge-friend-button'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(screen.getByText('Sign in to challenge friends.')).toBeTruthy();
  });
});

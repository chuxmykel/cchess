import { fireEvent, render } from '@testing-library/react-native';

import Settings from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

describe('Settings', () => {
  function renderAs(isGuest: boolean) {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest } }),
    );
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(<Settings navigation={navigation} />),
      navigation,
    };
  }

  it.each([
    ['appearance-row', 'Appearance'],
    ['analysis-settings-row', 'AnalysisSettings'],
    ['daily-game-settings-row', 'DailyGameSettings'],
    ['review-settings-row', 'ReviewSettings'],
    ['licenses-row', 'Licenses'],
  ])('%s opens %s', async (testID, route) => {
    const { screenPromise, navigation } = renderAs(true);
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId(testID));

    expect(navigation.navigate).toHaveBeenCalledWith(route);
  });

  it("offers the account's settings signed in, not to a guest", async () => {
    const guest = await renderAs(true).screenPromise;
    expect(guest.queryByTestId('account-row')).toBeNull();

    const { screenPromise, navigation } = renderAs(false);
    const signedIn = await screenPromise;
    await fireEvent.press(signedIn.getByTestId('account-row'));
    expect(navigation.navigate).toHaveBeenCalledWith('Account');
  });
});

import { fireEvent, render } from '@testing-library/react-native';

import ResetPassword from '.';
import { resetPassword } from '../../network/restClient';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  resetPassword: jest.fn(),
}));

describe('ResetPassword', () => {
  afterEach(() => jest.clearAllMocks());

  async function renderScreen() {
    const navigation = { replace: jest.fn() };
    const screen = await render(
      withSafeArea(
        <ResetPassword
          navigation={navigation as never}
          route={{ key: 'k', name: 'ResetPassword', params: { token: 'tok' } }}
        />,
      ),
    );
    return { screen, navigation };
  }

  it('sets the new password from the link, then offers to sign in', async () => {
    (resetPassword as jest.Mock).mockResolvedValue(undefined);
    const { screen, navigation } = await renderScreen();

    await fireEvent.changeText(
      screen.getByTestId('password-input'),
      'new-pass-1',
    );
    await fireEvent.changeText(
      screen.getByTestId('password-confirmation-input'),
      'new-pass-1',
    );
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(resetPassword).toHaveBeenCalledWith('tok', 'new-pass-1');
    expect(screen.getByTestId('reset-password-done')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('account-form-submit'));
    expect(navigation.replace).toHaveBeenCalledWith('SignIn');
  });

  it("won't send passwords that don't match", async () => {
    const { screen } = await renderScreen();
    await fireEvent.changeText(
      screen.getByTestId('password-input'),
      'new-pass-1',
    );
    await fireEvent.changeText(
      screen.getByTestId('password-confirmation-input'),
      'new-pass-2',
    );
    await fireEvent.press(screen.getByTestId('account-form-submit'));
    expect(resetPassword).not.toHaveBeenCalled();
    expect(screen.getByTestId('account-form-error')).toHaveTextContent(
      "The passwords don't match",
    );
  });
});

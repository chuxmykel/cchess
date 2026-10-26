import { fireEvent, render } from '@testing-library/react-native';

import SignIn from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError } from '../../network/restClient';
import { SIGN_IN_FAILED_MESSAGE } from '../../constants/errorMessages';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

describe('SignIn', () => {
  function renderScreen() {
    const session = makeAuthSession();
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { goBack: jest.fn(), replace: jest.fn() };
    const props = {
      navigation,
      route: { key: 'SignIn', name: 'SignIn' },
    } as unknown as Parameters<typeof SignIn>[0];
    return {
      screenPromise: render(withSafeArea(<SignIn {...props} />)),
      signIn: session.signIn as jest.Mock,
      navigation,
    };
  }

  async function fillIn(
    screen: Awaited<ReturnType<typeof renderScreen>['screenPromise']>,
    usernameOrEmail: string,
    password: string,
  ) {
    await fireEvent.changeText(
      screen.getByTestId('username-or-email-input'),
      usernameOrEmail,
    );
    await fireEvent.changeText(screen.getByTestId('password-input'), password);
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signs in with the trimmed username and goes back', async () => {
    const { screenPromise, signIn, navigation } = renderScreen();
    const screen = await screenPromise;

    await fillIn(screen, '  magnus ', 'secret123');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(signIn).toHaveBeenCalledWith({
      usernameOrEmail: 'magnus',
      password: 'secret123',
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("can't be submitted until both fields are filled in", async () => {
    const { screenPromise, signIn } = renderScreen();
    const screen = await screenPromise;

    await fillIn(screen, '   ', 'secret123');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows the server's reason and stays put when sign-in is rejected", async () => {
    const { screenPromise, signIn, navigation } = renderScreen();
    signIn.mockRejectedValue(new ApiError(401, 'Invalid credentials'));
    const screen = await screenPromise;

    await fillIn(screen, 'magnus', 'wrong-password');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(screen.getByTestId('account-form-error')).toHaveTextContent(
      'Invalid credentials',
    );
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("says it couldn't sign in when the server can't be reached", async () => {
    const { screenPromise, signIn } = renderScreen();
    signIn.mockRejectedValue(new ApiError(0, 'Network Error'));
    const screen = await screenPromise;

    await fillIn(screen, 'magnus', 'secret123');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(screen.getByTestId('account-form-error')).toHaveTextContent(
      SIGN_IN_FAILED_MESSAGE,
    );
  });

  it('switches to creating an account', async () => {
    const { screenPromise, navigation } = renderScreen();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('account-form-switch'));

    expect(navigation.replace).toHaveBeenCalledWith('CreateAccount');
  });
});

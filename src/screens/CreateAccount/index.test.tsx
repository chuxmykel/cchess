import { fireEvent, render } from '@testing-library/react-native';

import CreateAccount from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

describe('CreateAccount', () => {
  function renderScreen() {
    const session = makeAuthSession();
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { goBack: jest.fn(), replace: jest.fn() };
    const props = {
      navigation,
      route: { key: 'CreateAccount', name: 'CreateAccount' },
    } as unknown as Parameters<typeof CreateAccount>[0];
    return {
      screenPromise: render(withSafeArea(<CreateAccount {...props} />)),
      register: session.register as jest.Mock,
      navigation,
    };
  }

  async function fillIn(
    screen: Awaited<ReturnType<typeof renderScreen>['screenPromise']>,
    { username = 'magnus', email = 'm@example.com', password = 'secret123' },
  ) {
    await fireEvent.changeText(screen.getByTestId('username-input'), username);
    await fireEvent.changeText(screen.getByTestId('email-input'), email);
    await fireEvent.changeText(screen.getByTestId('password-input'), password);
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates the account with trimmed details and goes back', async () => {
    const { screenPromise, register, navigation } = renderScreen();
    const screen = await screenPromise;

    await fillIn(screen, { username: ' magnus ', email: ' m@example.com ' });
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(register).toHaveBeenCalledWith({
      username: 'magnus',
      email: 'm@example.com',
      password: 'secret123',
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("can't be submitted until every field is filled in", async () => {
    const { screenPromise, register } = renderScreen();
    const screen = await screenPromise;

    await fillIn(screen, { email: '' });
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(register).not.toHaveBeenCalled();
  });

  it("lists the server's validation messages", async () => {
    const { screenPromise, register, navigation } = renderScreen();
    register.mockRejectedValue(
      new ApiError(
        400,
        'email must be an email\npassword must be longer than or equal to 8 characters',
      ),
    );
    const screen = await screenPromise;

    await fillIn(screen, { email: 'nope', password: 'short' });
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(screen.getByTestId('account-form-error')).toHaveTextContent(
      'email must be an email\npassword must be longer than or equal to 8 characters',
    );
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('switches to signing in', async () => {
    const { screenPromise, navigation } = renderScreen();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('account-form-switch'));

    expect(navigation.replace).toHaveBeenCalledWith('SignIn');
  });
});

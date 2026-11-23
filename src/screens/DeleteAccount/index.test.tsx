import { fireEvent, render } from '@testing-library/react-native';

import DeleteAccount from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, deleteAccount } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  deleteAccount: jest.fn(),
}));

describe('DeleteAccount', () => {
  async function renderScreen() {
    const session = makeAuthSession({ user: { isGuest: false } });
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { popToTop: jest.fn() };
    const props = {
      navigation,
      route: { key: 'DeleteAccount', name: 'DeleteAccount' },
    } as unknown as Parameters<typeof DeleteAccount>[0];
    const screen = await render(withSafeArea(<DeleteAccount {...props} />));
    return { screen, session, navigation };
  }

  afterEach(() => jest.clearAllMocks());

  it('deletes with the password, starts afresh as a guest and goes Home', async () => {
    (deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const { screen, session, navigation } = await renderScreen();

    await fireEvent.changeText(screen.getByTestId('password-input'), 'secret');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(deleteAccount).toHaveBeenCalledWith('secret', 'access-token');
    expect(session.signOut).toHaveBeenCalledTimes(1);
    expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  });

  it("shows the server's reason, and stays signed in, on a wrong password", async () => {
    (deleteAccount as jest.Mock).mockRejectedValue(
      new ApiError(401, 'Wrong password'),
    );
    const { screen, session, navigation } = await renderScreen();

    await fireEvent.changeText(screen.getByTestId('password-input'), 'nope');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(screen.getByTestId('account-form-error')).toHaveTextContent(
      'Wrong password',
    );
    expect(session.signOut).not.toHaveBeenCalled();
    expect(navigation.popToTop).not.toHaveBeenCalled();
  });

  it("can't be submitted without the password", async () => {
    const { screen } = await renderScreen();
    await fireEvent.press(screen.getByTestId('account-form-submit'));
    expect(deleteAccount).not.toHaveBeenCalled();
  });
});

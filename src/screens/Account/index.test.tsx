import { act, fireEvent, render } from '@testing-library/react-native';

import Account from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  resendVerificationEmail,
  setChatWithStrangers,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { isSwitchOn } from '../../testUtils/switch';

jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  setChatWithStrangers: jest.fn(),
  resendVerificationEmail: jest.fn(),
}));

describe('Account', () => {
  function renderAs(chatWithStrangers: boolean, emailVerified = true) {
    const session = makeAuthSession({
      user: {
        isGuest: false,
        chatWithStrangers,
        email: 'ana@example.com',
        emailVerified,
      },
    });
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(<Account navigation={navigation} />),
      navigation,
      session,
    };
  }

  afterEach(() => jest.clearAllMocks());

  it.each([
    ['change-email-row', 'ChangeEmail'],
    ['blocked-players-row', 'BlockedPlayers'],
    ['delete-account-row', 'DeleteAccount'],
  ])('%s opens %s', async (testID, route) => {
    const { screenPromise, navigation } = renderAs(false);
    const screen = await screenPromise;
    await fireEvent.press(screen.getByTestId(testID));
    expect(navigation.navigate).toHaveBeenCalledWith(route);
  });

  it('turns chat with strangers on, saved on the server', async () => {
    (setChatWithStrangers as jest.Mock).mockResolvedValue({});
    const { screenPromise, session } = renderAs(false);
    const screen = await screenPromise;
    const toggle = screen.getByTestId('chat-with-strangers-switch');
    expect(isSwitchOn(toggle)).toBe(false);

    await fireEvent(toggle, 'valueChange', true);
    await act(async () => {});

    expect(setChatWithStrangers).toHaveBeenCalledWith(true, 'access-token');
    expect(session.reloadUser).toHaveBeenCalled();
    expect(isSwitchOn(screen.getByTestId('chat-with-strangers-switch'))).toBe(
      true,
    );
  });

  it('sends the verification link again while the email is unverified', async () => {
    (resendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
    const verified = await renderAs(false, true).screenPromise;
    expect(verified.getByTestId('account-email-status')).toHaveTextContent(
      'Verified',
    );
    expect(verified.queryByTestId('resend-verification-button')).toBeNull();

    const screen = await renderAs(false, false).screenPromise;
    await fireEvent.press(screen.getByTestId('resend-verification-button'));
    expect(resendVerificationEmail).toHaveBeenCalledWith('access-token');
    expect(screen.getByTestId('account-email-status')).toHaveTextContent(
      /we sent a new link/,
    );
  });
});

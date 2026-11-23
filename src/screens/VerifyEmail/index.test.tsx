import { render } from '@testing-library/react-native';

import VerifyEmail from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, verifyEmail } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  verifyEmail: jest.fn(),
}));

describe('VerifyEmail', () => {
  function renderScreen() {
    const session = makeAuthSession({ user: { isGuest: false } });
    (useAuthSession as jest.Mock).mockReturnValue(session);
    return {
      screenPromise: render(
        <VerifyEmail
          navigation={{ popToTop: jest.fn() } as never}
          route={{ key: 'k', name: 'VerifyEmail', params: { token: 'tok' } }}
        />,
      ),
      session,
    };
  }

  afterEach(() => jest.clearAllMocks());

  it('confirms the address with the link, and reloads the account', async () => {
    (verifyEmail as jest.Mock).mockResolvedValue({ email: 'a@b.test' });
    const { screenPromise, session } = renderScreen();
    const screen = await screenPromise;

    expect(await screen.findByTestId('verify-email-result')).toHaveTextContent(
      'a@b.test is confirmed.',
    );
    expect(verifyEmail).toHaveBeenCalledWith('tok');
    expect(session.reloadUser).toHaveBeenCalled();
  });

  it("says why when the link doesn't work", async () => {
    (verifyEmail as jest.Mock).mockRejectedValue(
      new ApiError(400, 'This link has expired or was already used'),
    );
    const screen = await renderScreen().screenPromise;
    expect(await screen.findByTestId('verify-email-result')).toHaveTextContent(
      'This link has expired or was already used',
    );
  });
});

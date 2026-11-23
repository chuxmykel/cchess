import { fireEvent, render } from '@testing-library/react-native';

import ForgotPassword from '.';
import { requestPasswordReset } from '../../network/restClient';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  requestPasswordReset: jest.fn(),
}));

describe('ForgotPassword', () => {
  afterEach(() => jest.clearAllMocks());

  it('asks for a link, then says one is on its way if the account exists', async () => {
    (requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
    const navigation = { goBack: jest.fn() };
    const screen = await render(
      withSafeArea(
        <ForgotPassword
          navigation={navigation as never}
          route={{ key: 'k', name: 'ForgotPassword' }}
        />,
      ),
    );

    await fireEvent.changeText(screen.getByTestId('email-input'), ' a@b.test ');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(requestPasswordReset).toHaveBeenCalledWith('a@b.test');
    expect(screen.getByTestId('forgot-password-sent')).toHaveTextContent(
      /If a@b.test has a cchess account/,
    );
    await fireEvent.press(screen.getByTestId('account-form-submit'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

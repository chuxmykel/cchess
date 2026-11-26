import { act, fireEvent, render } from '@testing-library/react-native';

import TermsPrompt from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { acceptTerms } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  acceptTerms: jest.fn(),
}));

describe('TermsPrompt', () => {
  afterEach(() => jest.clearAllMocks());

  it.each([
    ['a guest', { isGuest: true, termsAccepted: false }],
    ['an account that has accepted', { isGuest: false, termsAccepted: true }],
    ['an older server', { isGuest: false }],
  ])("doesn't ask %s", async (_who, user) => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession({ user }));
    const screen = await render(<TermsPrompt />);
    expect(screen.queryByTestId('terms-prompt')).toBeNull();
  });

  it('asks an account that has not accepted, and accepts', async () => {
    (acceptTerms as jest.Mock).mockResolvedValue(undefined);
    const session = makeAuthSession({
      user: { isGuest: false, termsAccepted: false },
    });
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const screen = await render(<TermsPrompt />);

    await fireEvent.press(screen.getByTestId('terms-prompt-accept'));
    await act(async () => {});

    expect(acceptTerms).toHaveBeenCalledWith('access-token');
    expect(session.reloadUser).toHaveBeenCalled();
  });
});

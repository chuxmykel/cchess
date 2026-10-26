import { fireEvent, render } from '@testing-library/react-native';

import SignInPrompt from '.';

describe('SignInPrompt', () => {
  function renderPrompt() {
    const onSignIn = jest.fn();
    const onCreateAccount = jest.fn();
    const screenPromise = render(
      <SignInPrompt onSignIn={onSignIn} onCreateAccount={onCreateAccount} />,
    );
    return { screenPromise, onSignIn, onCreateAccount };
  }

  it('tells guests what signing in gets them', async () => {
    const { screenPromise } = renderPrompt();
    const screen = await screenPromise;

    expect(screen.getByText("You're playing as a guest")).toBeTruthy();
    expect(
      screen.getByText('Sign in to play rated games and add friends.'),
    ).toBeTruthy();
  });

  it('signs in', async () => {
    const { screenPromise, onSignIn, onCreateAccount } = renderPrompt();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('sign-in-button'));

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onCreateAccount).not.toHaveBeenCalled();
  });

  it('creates an account', async () => {
    const { screenPromise, onSignIn, onCreateAccount } = renderPrompt();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('create-account-button'));

    expect(onCreateAccount).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });
});

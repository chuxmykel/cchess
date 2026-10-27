import { fireEvent, render } from '@testing-library/react-native';

import PasswordField from '.';

describe('PasswordField', () => {
  function renderField() {
    return render(
      <PasswordField label="Password" value="secret123" testID="password" />,
    );
  }

  it('hides the password, offering to show it', async () => {
    const screen = await renderField();

    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', true);
    expect(screen.getByTestId('password-visibility-icon')).toHaveProp(
      'name',
      'eye-outline',
    );
    expect(screen.getByLabelText('Show password')).toBeTruthy();
  });

  it('shows the password when the eye is pressed', async () => {
    const screen = await renderField();

    await fireEvent.press(screen.getByTestId('password-visibility-toggle'));

    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', false);
    expect(screen.getByTestId('password-visibility-icon')).toHaveProp(
      'name',
      'eye-off-outline',
    );
    expect(screen.getByLabelText('Hide password')).toBeTruthy();
  });

  it('hides it again on a second press', async () => {
    const screen = await renderField();
    const toggle = screen.getByTestId('password-visibility-toggle');

    await fireEvent.press(toggle);
    await fireEvent.press(toggle);

    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', true);
  });
});

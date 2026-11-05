import { fireEvent, render } from '@testing-library/react-native';

import AppearanceSettingsForm from '.';
import { DEFAULT_APPEARANCE_SETTINGS } from '../../constants/appearance';

describe('AppearanceSettingsForm', () => {
  async function renderForm(settings = DEFAULT_APPEARANCE_SETTINGS) {
    const onChange = jest.fn();
    const screen = await render(
      <AppearanceSettingsForm settings={settings} onChange={onChange} />,
    );
    return { screen, onChange };
  }

  it('follows the system until light or dark is chosen', async () => {
    const { screen, onChange } = await renderForm();
    expect(screen.getByTestId('color-scheme-system')).toBeChecked();

    await fireEvent.press(screen.getByTestId('color-scheme-dark'));

    expect(onChange).toHaveBeenCalledWith({ colorScheme: 'dark' });
  });

  it("marks the board in use, and picks another's colors", async () => {
    const { screen, onChange } = await renderForm({
      ...DEFAULT_APPEARANCE_SETTINGS,
      boardTheme: 'chess.com',
    });
    expect(screen.getByTestId('board-theme-chess.com')).toBeChecked();
    expect(screen.getByTestId('board-theme-test')).not.toBeChecked();

    await fireEvent.press(screen.getByTestId('board-theme-lichess.org'));

    expect(onChange).toHaveBeenCalledWith({ boardTheme: 'lichess.org' });
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

import DailyGameSettings from '.';
import { DailyGameSettingsProvider } from '../../context/DailyGameSettingsContext';

describe('DailyGameSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  async function renderScreen() {
    const screen = await render(
      <DailyGameSettingsProvider>
        <DailyGameSettings />
      </DailyGameSettingsProvider>,
    );
    await act(async () => {});
    return screen;
  }

  it('leaves moves unconfirmed until switched on, and keeps the choice', async () => {
    const screen = await renderScreen();
    const toggle = () => screen.getByTestId('daily-setting-confirmMoves');
    expect(toggle().props.value).toBe(false);

    await fireEvent(toggle(), 'valueChange', true);
    expect(toggle().props.value).toBe(true);

    const again = await renderScreen();
    expect(again.getByTestId('daily-setting-confirmMoves').props.value).toBe(
      true,
    );
  });
});

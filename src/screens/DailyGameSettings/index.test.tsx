import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

import DailyGameSettings from '.';
import { DailyGameSettingsProvider } from '../../context/DailyGameSettingsContext';
import { isSwitchOn } from '../../testUtils/switch';

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

  it('confirms moves until switched off, and keeps the choice', async () => {
    const screen = await renderScreen();
    const toggle = () => screen.getByTestId('daily-setting-confirmMoves');
    expect(isSwitchOn(toggle())).toBe(true);

    await fireEvent(toggle(), 'valueChange', false);
    expect(isSwitchOn(toggle())).toBe(false);

    const again = await renderScreen();
    expect(isSwitchOn(again.getByTestId('daily-setting-confirmMoves'))).toBe(
      false,
    );
  });
});

import { fireEvent, render } from '@testing-library/react-native';

import Settings from '.';

describe('Settings', () => {
  it.each([
    ['appearance-row', 'Appearance'],
    ['analysis-settings-row', 'AnalysisSettings'],
    ['daily-game-settings-row', 'DailyGameSettings'],
    ['licenses-row', 'Licenses'],
  ])('%s opens %s', async (testID, route) => {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<Settings navigation={navigation} />);

    await fireEvent.press(screen.getByTestId(testID));

    expect(navigation.navigate).toHaveBeenCalledWith(route);
  });
});

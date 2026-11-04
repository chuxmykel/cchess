import { fireEvent, render } from '@testing-library/react-native';

import AnalysisHome from '.';

describe('AnalysisHome', () => {
  async function renderHome() {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<AnalysisHome navigation={navigation} />);
    return { screen, navigation };
  }

  it.each([
    ['analysis-new', 'AnalysisBoard', { source: { kind: 'new' } }],
    ['analysis-set-up', 'AnalysisBoard', { source: { kind: 'setup' } }],
    ['analysis-pick-game', 'PickGame', undefined],
    ['analysis-paste', 'PasteGame', undefined],
  ])('%s opens %s', async (testID, route, params) => {
    const { screen, navigation } = await renderHome();

    await fireEvent.press(screen.getByTestId(testID));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ...(params ? [route, params] : [route]),
    );
  });
});

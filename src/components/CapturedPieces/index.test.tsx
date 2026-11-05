import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import CapturedPieces from '.';
import { ThemeProvider } from '../../context/ThemeContext';
import { darkTheme } from '../../theme';

describe('CapturedPieces', () => {
  beforeEach(() => AsyncStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  async function renderInDarkMode(color: 'w' | 'b') {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const screen = await render(
      <ThemeProvider>
        <CapturedPieces color={color} material={{ pieces: ['p'], score: 1 }} />
      </ThemeProvider>,
    );
    await act(async () => {});
    return screen;
  }

  it('outlines black pieces in dark mode, so they show on its background', async () => {
    const screen = await renderInDarkMode('w');

    expect(screen.getByTestId('captured-piece-w')).toHaveStyle({
      shadowColor: darkTheme.colors.pieceOutline,
      shadowOpacity: 1,
    });
  });

  it("doesn't outline white pieces", async () => {
    const screen = await renderInDarkMode('b');

    expect(screen.getByTestId('captured-piece-b')).not.toHaveStyle({
      shadowColor: darkTheme.colors.pieceOutline,
    });
  });
});

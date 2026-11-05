import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, within } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import CapturedPieces from '.';
import { ThemeProvider } from '../../context/ThemeContext';
import { darkTheme, lightTheme } from '../../theme';

describe('CapturedPieces', () => {
  beforeEach(() => AsyncStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ] as const)(
    "draws either side's pieces in the same grey in %s mode",
    async (scheme, theme) => {
      jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
      const material = { pieces: ['p' as const], score: 1 };
      const screen = await render(
        <ThemeProvider>
          <CapturedPieces color="w" material={material} />
          <CapturedPieces color="b" material={material} />
        </ThemeProvider>,
      );
      await act(async () => {});

      for (const id of ['captured-piece-w', 'captured-piece-b']) {
        const { xml } = within(screen.getByTestId(id)).getByTestId(
          'captured-piece-drawing',
        ).props;
        const colors = [...xml.matchAll(/(?:fill|stroke)="([^"]*)"/g)]
          .map(([, color]) => color)
          .filter((color) => color !== 'none');
        expect(new Set(colors)).toEqual(new Set([theme.colors.capturedPiece]));
      }
    },
  );
});

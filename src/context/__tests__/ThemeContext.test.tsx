import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import {
  ThemeProvider,
  useAppearance,
  useBoardColors,
  useTheme,
} from '../ThemeContext';
import { BOARD_THEMES } from '../../theme/boardThemes';
import { darkTheme, lightTheme } from '../../theme/themes';

function useThemeAndAppearance() {
  return {
    theme: useTheme(),
    appearance: useAppearance(),
    board: useBoardColors(),
  };
}

async function renderInProvider() {
  const rendered = await renderHook(() => useThemeAndAppearance(), {
    wrapper: ThemeProvider,
  });
  await act(async () => {});
  return rendered;
}

describe('ThemeProvider', () => {
  beforeEach(() => AsyncStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
    [null, lightTheme],
  ] as const)(
    'gives the %s theme while iOS is in it',
    async (scheme, theme) => {
      jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);

      const { result } = await renderInProvider();

      expect(result.current.theme).toBe(theme);
    },
  );

  it.each([
    ['light', 'dark', lightTheme],
    ['dark', 'light', darkTheme],
  ] as const)(
    'gives the %s theme when chosen, whatever iOS is in',
    async (chosen, system, theme) => {
      jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(system);
      const { result } = await renderInProvider();

      await act(async () =>
        result.current.appearance.update({ colorScheme: chosen }),
      );

      expect(result.current.theme).toBe(theme);
    },
  );

  it("gives the chosen board's colors", async () => {
    const { result } = await renderInProvider();
    expect(result.current.board).toBe(BOARD_THEMES.test);

    await act(async () =>
      result.current.appearance.update({ boardTheme: 'lichess.org' }),
    );

    expect(result.current.board).toBe(BOARD_THEMES['lichess.org']);
  });
});

describe('outside a ThemeProvider', () => {
  it('gives the light theme and the default board', async () => {
    const { result } = await renderHook(() => ({
      theme: useTheme(),
      board: useBoardColors(),
    }));

    expect(result.current.theme).toBe(lightTheme);
    expect(result.current.board).toBe(BOARD_THEMES.test);
  });

  it('has no appearance settings to change', async () => {
    const { result } = await renderHook(() => {
      try {
        return useAppearance();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });
});

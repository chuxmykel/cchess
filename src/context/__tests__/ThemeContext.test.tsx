import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { ThemeProvider, useTheme } from '../ThemeContext';
import { darkTheme, lightTheme } from '../../theme/themes';

describe('ThemeProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
    [null, lightTheme],
  ] as const)(
    'gives the %s theme while iOS is in it',
    async (scheme, theme) => {
      jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);

      const { result } = await renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toBe(theme);
    },
  );
});

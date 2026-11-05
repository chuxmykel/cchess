import { renderHook } from '@testing-library/react-native';

import { ThemeProvider } from '../../context/ThemeContext';
import { makeStyles } from '../makeStyles';
import { lightTheme } from '../themes';

const useStyles = makeStyles((t) => ({
  card: { backgroundColor: t.colors.surface, padding: t.spacing.lg },
}));

describe('makeStyles', () => {
  it('draws the styles from the light theme outside a ThemeProvider', async () => {
    const { result } = await renderHook(() => useStyles());

    expect(result.current.card).toEqual({
      backgroundColor: lightTheme.colors.surface,
      padding: lightTheme.spacing.lg,
    });
  });

  it("draws them from the provider's theme inside one", async () => {
    const { result } = await renderHook(() => useStyles(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.card.backgroundColor).toBe(lightTheme.colors.surface);
  });

  it('makes the sheet once per theme, not on every render', async () => {
    const { result, rerender } = await renderHook(() => useStyles());
    const first = result.current;

    await rerender({});

    expect(result.current).toBe(first);
  });
});

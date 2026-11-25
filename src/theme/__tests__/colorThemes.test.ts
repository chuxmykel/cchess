import { COLOR_THEMES, ColorThemeName, ThemeMode } from '../themes';

// WCAG's contrast between two six-digit hex colors.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const NEW_THEMES: ColorThemeName[] = ['brass', 'vermilion', 'teal', 'violet'];
const MODES: ThemeMode[] = ['light', 'dark'];

describe.each(NEW_THEMES)('the %s color theme', (name) => {
  it.each(MODES)('is the %s mode it says', (mode) => {
    expect(COLOR_THEMES[name][mode].mode).toBe(mode);
  });

  it.each(MODES)('keeps its text readable in %s mode', (mode) => {
    const { colors } = COLOR_THEMES[name][mode];
    for (const ground of [colors.background, colors.surface]) {
      expect(contrast(colors.text, ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(colors.textMuted, ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.accentText, ground)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(colors.textOnAccent, colors.accent)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("keeps Classic's colors that mean something on the board", () => {
    const theme = COLOR_THEMES[name].light;
    expect(theme.colors.moveClass).toBe(
      COLOR_THEMES.classic.light.colors.moveClass,
    );
    expect(theme.colors.board.check).toBe(
      COLOR_THEMES.classic.light.colors.board.check,
    );
  });
});

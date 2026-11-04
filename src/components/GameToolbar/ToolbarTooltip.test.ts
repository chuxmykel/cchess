import { TOOLTIP_SCREEN_MARGIN, tooltipShift } from './ToolbarTooltip';

describe('tooltipShift', () => {
  const SCREEN = 400;

  it('leaves a tooltip centred over its button when it fits', () => {
    expect(tooltipShift(180, 40, 100, SCREEN)).toBe(0);
  });

  it('moves one over a button at the left edge in from it', () => {
    // Centred, it would start at 20 + 22 - 60 = -18.
    expect(tooltipShift(20, 44, 120, SCREEN)).toBe(TOOLTIP_SCREEN_MARGIN + 18);
  });

  it('moves one over a button at the right edge in from it', () => {
    // Centred, it would end at 336 + 22 + 60 = 418.
    expect(tooltipShift(336, 44, 120, SCREEN)).toBe(
      -(18 + TOOLTIP_SCREEN_MARGIN),
    );
  });
});

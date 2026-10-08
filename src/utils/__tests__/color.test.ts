import { tintColor } from '../color';

describe('tintColor', () => {
  it('returns the color unchanged at amount 0', () => {
    expect(tintColor('#769656', 0)).toBe('rgb(118, 150, 86)');
  });

  it('returns pure white at amount 1, regardless of the input color', () => {
    expect(tintColor('#769656', 1)).toBe('rgb(255, 255, 255)');
    expect(tintColor('#000000', 1)).toBe('rgb(255, 255, 255)');
  });

  it('mixes proportionally at a fractional amount', () => {
    expect(tintColor('#769656', 0.5)).toBe('rgb(187, 203, 171)');
  });

  it('works with a color that has no # prefix', () => {
    expect(tintColor('769656', 0)).toBe('rgb(118, 150, 86)');
  });
});

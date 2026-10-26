import { findTimeControl, TIME_CONTROL_GROUPS } from '../timeControls';

describe('findTimeControl', () => {
  it('returns the matching preset', () => {
    const preset = TIME_CONTROL_GROUPS[0].options[3]; // bullet 2+1

    expect(findTimeControl(2, 1, 'bullet')).toBe(preset);
  });

  it("finds the 0+1 preset by its real fractional base time, not its label's 0", () => {
    const zeroPlusOne = TIME_CONTROL_GROUPS[0].options[0];

    expect(findTimeControl(zeroPlusOne.minutes, 1, 'bullet')).toBe(zeroPlusOne);
  });

  it('builds a labelled time control for anything that is not a preset', () => {
    expect(findTimeControl(7, 2, 'blitz')).toEqual({
      type: 'blitz',
      label: '7+2',
      minutes: 7,
      incrementSeconds: 2,
    });
  });
});

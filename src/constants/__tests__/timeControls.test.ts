import { findTimeControl, TIME_CONTROL_GROUPS } from '../timeControls';

describe('findTimeControl', () => {
  it('returns the matching preset', () => {
    const preset = TIME_CONTROL_GROUPS[0].options[3]; // bullet 2+1

    expect(findTimeControl(120, 1, 'bullet')).toBe(preset);
  });

  it("finds the 0+1 preset by its real 5-second start, not its label's 0", () => {
    const zeroPlusOne = TIME_CONTROL_GROUPS[0].options[0];

    expect(findTimeControl(zeroPlusOne.initialSeconds, 1, 'bullet')).toBe(
      zeroPlusOne,
    );
  });

  it('builds a labelled time control for anything that is not a preset', () => {
    expect(findTimeControl(420, 2, 'blitz')).toEqual({
      type: 'blitz',
      label: '7+2',
      initialSeconds: 420,
      incrementSeconds: 2,
    });
  });

  it('labels a start of under a minute in seconds', () => {
    expect(findTimeControl(15, 0, 'bullet').label).toBe('15s+0');
  });
});

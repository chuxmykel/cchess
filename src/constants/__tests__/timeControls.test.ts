import {
  animatesMoves,
  daysPerMove,
  findTimeControl,
  isDailyTimeControl,
  TIME_CONTROL_GROUPS,
  timeControlOf,
} from '../timeControls';

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

  it("finds a daily game's preset by its days, in seconds", () => {
    const sevenDays = findTimeControl(7 * 24 * 60 * 60, 0, 'daily');

    expect(sevenDays.label).toBe('7 days');
    expect(TIME_CONTROL_GROUPS[4].options).toContain(sevenDays);
    expect(isDailyTimeControl(sevenDays)).toBe(true);
    expect(daysPerMove(sevenDays)).toBe(7);
    expect(isDailyTimeControl(findTimeControl(3600, 0, 'classical'))).toBe(
      false,
    );
  });
});

describe('timeControlOf', () => {
  it("finds a game's time control from its clock settings", () => {
    expect(
      timeControlOf({
        initialSeconds: 120,
        incrementSeconds: 1,
        gameType: 'bullet',
      }),
    ).toBe(findTimeControl(120, 1, 'bullet'));
  });
});

describe('animatesMoves', () => {
  it('moves pieces at once in bullet - anything under 3+0', () => {
    expect(animatesMoves('bullet')).toBe(false);
  });

  it.each(['blitz', 'rapid', 'classical', 'daily'] as const)(
    'slides pieces in %s - 3+0 and up',
    (type) => {
      expect(animatesMoves(type)).toBe(true);
    },
  );
});

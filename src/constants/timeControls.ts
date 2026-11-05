import { GameType } from '../domain/types';

export interface TimeControl {
  type: GameType;
  label: string;
  /** Starting clock per side, in whole seconds. */
  initialSeconds: number;
  incrementSeconds: number;
}

interface TimeControlGroup {
  type: GameType;
  options: TimeControl[];
}

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  daily: 'Daily',
};

export const SECONDS_PER_DAY = 24 * 60 * 60;

/** The days a daily game gives each move, chess.com's. A daily time
 * control is one of these as whole days in initialSeconds, with no
 * increment: every move resets the mover's clock to it, so it never builds
 * up (the server's time-control.ts). */
export const DAILY_DAYS = [1, 2, 3, 5, 7, 14] as const;

/** "3 days", "1 day". */
export function daysLabel(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** A daily time control's days per move. */
export function daysPerMove(timeControl: { initialSeconds: number }): number {
  return timeControl.initialSeconds / SECONDS_PER_DAY;
}

export function isDailyTimeControl(timeControl: {
  initialSeconds: number;
}): boolean {
  return timeControl.initialSeconds >= SECONDS_PER_DAY;
}

// Whether a game's board slides its pieces to their squares: not in bullet
// - anything under 3+0 - where there's no time to watch them go; there they
// move at once. Stepping back through a game follows its time control too.
export function animatesMoves(type: GameType): boolean {
  return type !== 'bullet';
}

// The "0+1" preset displays as a literal 0, lichess-style, but a real
// 0-second start would flag at once - so it carries a 5-second one.
const ZERO_PLUS_ONE_INITIAL_SECONDS = 5;

export const TIME_CONTROL_GROUPS: TimeControlGroup[] = [
  {
    type: 'bullet',
    options: [
      {
        type: 'bullet',
        label: '0+1',
        initialSeconds: ZERO_PLUS_ONE_INITIAL_SECONDS,
        incrementSeconds: 1,
      },
      { type: 'bullet', label: '1+0', initialSeconds: 60, incrementSeconds: 0 },
      { type: 'bullet', label: '1+1', initialSeconds: 60, incrementSeconds: 1 },
      {
        type: 'bullet',
        label: '2+1',
        initialSeconds: 120,
        incrementSeconds: 1,
      },
    ],
  },
  {
    type: 'blitz',
    options: [
      { type: 'blitz', label: '3+0', initialSeconds: 180, incrementSeconds: 0 },
      { type: 'blitz', label: '3+2', initialSeconds: 180, incrementSeconds: 2 },
      { type: 'blitz', label: '5+0', initialSeconds: 300, incrementSeconds: 0 },
      { type: 'blitz', label: '5+3', initialSeconds: 300, incrementSeconds: 3 },
    ],
  },
  {
    type: 'rapid',
    options: [
      {
        type: 'rapid',
        label: '10+0',
        initialSeconds: 600,
        incrementSeconds: 0,
      },
      {
        type: 'rapid',
        label: '10+5',
        initialSeconds: 600,
        incrementSeconds: 5,
      },
      {
        type: 'rapid',
        label: '15+0',
        initialSeconds: 900,
        incrementSeconds: 0,
      },
      {
        type: 'rapid',
        label: '15+10',
        initialSeconds: 900,
        incrementSeconds: 10,
      },
    ],
  },
  {
    type: 'classical',
    options: [
      {
        type: 'classical',
        label: '25+0',
        initialSeconds: 1500,
        incrementSeconds: 0,
      },
      {
        type: 'classical',
        label: '30+0',
        initialSeconds: 1800,
        incrementSeconds: 0,
      },
      {
        type: 'classical',
        label: '30+20',
        initialSeconds: 1800,
        incrementSeconds: 20,
      },
      {
        type: 'classical',
        label: '60+0',
        initialSeconds: 3600,
        incrementSeconds: 0,
      },
    ],
  },
  {
    type: 'daily',
    options: DAILY_DAYS.map((days) => ({
      type: 'daily' as const,
      label: daysLabel(days),
      initialSeconds: days * SECONDS_PER_DAY,
      incrementSeconds: 0,
    })),
  },
];

export const DEFAULT_TIME_CONTROL: TimeControl =
  TIME_CONTROL_GROUPS[1].options[2];

const ALL_TIME_CONTROLS: TimeControl[] = TIME_CONTROL_GROUPS.flatMap(
  (group) => group.options,
);

/** "5+3" - or "15s+0" for a start of under a minute, in seconds, or
 * "3 days" for a daily game. */
function timeControlLabel(
  initialSeconds: number,
  incrementSeconds: number,
): string {
  if (isDailyTimeControl({ initialSeconds })) {
    return daysLabel(daysPerMove({ initialSeconds }));
  }
  const base =
    initialSeconds % 60 === 0 ? `${initialSeconds / 60}` : `${initialSeconds}s`;
  return `${base}+${incrementSeconds}`;
}

export function findTimeControl(
  initialSeconds: number,
  incrementSeconds: number,
  type: GameType,
): TimeControl {
  const preset = ALL_TIME_CONTROLS.find(
    (option) =>
      option.initialSeconds === initialSeconds &&
      option.incrementSeconds === incrementSeconds,
  );
  return (
    preset ?? {
      type,
      label: timeControlLabel(initialSeconds, incrementSeconds),
      initialSeconds,
      incrementSeconds,
    }
  );
}

/** The clock settings a game or challenge carries, as the server sends
 * them. */
export type TimedGame = {
  initialSeconds: number;
  incrementSeconds: number;
  gameType: GameType;
};

/** A game's or challenge's time control. */
export function timeControlOf(game: TimedGame): TimeControl {
  return findTimeControl(
    game.initialSeconds,
    game.incrementSeconds,
    game.gameType,
  );
}

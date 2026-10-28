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
};

export const GAME_TYPE_COLORS: Record<GameType, string> = {
  bullet: '#F5A623',
  blitz: '#E8601C',
  rapid: '#8E6E53',
  classical: '#3A3A3A',
};

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
];

export const DEFAULT_TIME_CONTROL: TimeControl =
  TIME_CONTROL_GROUPS[1].options[2];

const ALL_TIME_CONTROLS: TimeControl[] = TIME_CONTROL_GROUPS.flatMap(
  (group) => group.options,
);

/** "5+3" - or "15s+0" for a start of under a minute, in seconds. */
function timeControlLabel(
  initialSeconds: number,
  incrementSeconds: number,
): string {
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

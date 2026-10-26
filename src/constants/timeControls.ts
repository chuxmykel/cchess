import { GameType } from '../domain/types';

export interface TimeControl {
  type: GameType;
  label: string;
  minutes: number;
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
// 0-minute base time seeds both server-side clocks to 0ms (instant flag) -
// confirmed against cchess-be's matchmaking: minutes is sent on to
// GamesService.createGameLocal's toClockMs(tc) = tc.minutes * 60 * 1000
// unchanged, so this needs to carry the actual 5-second base time as a
// fraction of a minute for the server to seed a playable clock.
const FIVE_SECONDS_IN_MINUTES = 5 / 60;

export const TIME_CONTROL_GROUPS: TimeControlGroup[] = [
  {
    type: 'bullet',
    options: [
      {
        type: 'bullet',
        label: '0+1',
        minutes: FIVE_SECONDS_IN_MINUTES,
        incrementSeconds: 1,
      },
      { type: 'bullet', label: '1+0', minutes: 1, incrementSeconds: 0 },
      { type: 'bullet', label: '1+1', minutes: 1, incrementSeconds: 1 },
      { type: 'bullet', label: '2+1', minutes: 2, incrementSeconds: 1 },
    ],
  },
  {
    type: 'blitz',
    options: [
      { type: 'blitz', label: '3+0', minutes: 3, incrementSeconds: 0 },
      { type: 'blitz', label: '3+2', minutes: 3, incrementSeconds: 2 },
      { type: 'blitz', label: '5+0', minutes: 5, incrementSeconds: 0 },
      { type: 'blitz', label: '5+3', minutes: 5, incrementSeconds: 3 },
    ],
  },
  {
    type: 'rapid',
    options: [
      { type: 'rapid', label: '10+0', minutes: 10, incrementSeconds: 0 },
      { type: 'rapid', label: '10+5', minutes: 10, incrementSeconds: 5 },
      { type: 'rapid', label: '15+0', minutes: 15, incrementSeconds: 0 },
      { type: 'rapid', label: '15+10', minutes: 15, incrementSeconds: 10 },
    ],
  },
  {
    type: 'classical',
    options: [
      { type: 'classical', label: '25+0', minutes: 25, incrementSeconds: 0 },
      { type: 'classical', label: '30+0', minutes: 30, incrementSeconds: 0 },
      {
        type: 'classical',
        label: '30+20',
        minutes: 30,
        incrementSeconds: 20,
      },
      { type: 'classical', label: '60+0', minutes: 60, incrementSeconds: 0 },
    ],
  },
];

export const DEFAULT_TIME_CONTROL: TimeControl =
  TIME_CONTROL_GROUPS[1].options[2];

const ALL_TIME_CONTROLS: TimeControl[] = TIME_CONTROL_GROUPS.flatMap(
  (group) => group.options,
);

export function findTimeControl(
  minutes: number,
  incrementSeconds: number,
  type: GameType,
): TimeControl {
  const preset = ALL_TIME_CONTROLS.find(
    (option) =>
      option.minutes === minutes &&
      option.incrementSeconds === incrementSeconds,
  );
  return (
    preset ?? {
      type,
      label: `${minutes}+${incrementSeconds}`,
      minutes,
      incrementSeconds,
    }
  );
}

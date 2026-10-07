import { GameType } from "../domain/types";

export interface TimeControl {
  type: GameType;
  label: string;
}

interface TimeControlGroup {
  type: GameType;
  options: TimeControl[];
}

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  classical: "Classical",
};

export const GAME_TYPE_COLORS: Record<GameType, string> = {
  bullet: "#F5A623",
  blitz: "#E8601C",
  rapid: "#8E6E53",
  classical: "#3A3A3A",
};

export const TIME_CONTROL_GROUPS: TimeControlGroup[] = [
  {
    type: "bullet",
    options: [
      { type: "bullet", label: "0+1" },
      { type: "bullet", label: "1+0" },
      { type: "bullet", label: "1+1" },
      { type: "bullet", label: "2+1" },
    ],
  },
  {
    type: "blitz",
    options: [
      { type: "blitz", label: "3+0" },
      { type: "blitz", label: "3+2" },
      { type: "blitz", label: "5+0" },
      { type: "blitz", label: "5+3" },
    ],
  },
  {
    type: "rapid",
    options: [
      { type: "rapid", label: "10+0" },
      { type: "rapid", label: "10+5" },
      { type: "rapid", label: "15+0" },
      { type: "rapid", label: "15+10" },
    ],
  },
  {
    type: "classical",
    options: [
      { type: "classical", label: "25+0" },
      { type: "classical", label: "30+0" },
      { type: "classical", label: "30+20" },
      { type: "classical", label: "60+0" },
    ],
  },
];

export const DEFAULT_TIME_CONTROL: TimeControl = TIME_CONTROL_GROUPS[1].options[2];

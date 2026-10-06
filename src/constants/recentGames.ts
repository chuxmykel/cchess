import { GameType, GameResult } from "../domain/types";

export interface RecentGame {
  id: string;
  type: GameType;
  opponentName: string;
  opponentRating: number;
  playedAt: string;
  result: GameResult;
}

// FIXME: Placeholder data until recent games are backed by a real API.
export const RECENT_GAMES: RecentGame[] = [
  {
    id: "1",
    type: "bullet",
    opponentName: "Ada Lovelace",
    opponentRating: 1450,
    playedAt: "1h ago",
    result: "win",
  },
  {
    id: "2",
    type: "blitz",
    opponentName: "Garry Kasparov",
    opponentRating: 2100,
    playedAt: "3h ago",
    result: "loss",
  },
  {
    id: "3",
    type: "rapid",
    opponentName: "Judit Polgar",
    opponentRating: 1980,
    playedAt: "Yesterday",
    result: "draw",
  },
  {
    id: "4",
    type: "classical",
    opponentName: "Magnus Carlsen",
    opponentRating: 2200,
    playedAt: "2 days ago",
    result: "win",
  },
  {
    id: "5",
    type: "bullet",
    opponentName: "Hou Yifan",
    opponentRating: 1875,
    playedAt: "3 days ago",
    result: "loss",
  },
  {
    id: "6",
    type: "blitz",
    opponentName: "Bobby Fischer",
    opponentRating: 2250,
    playedAt: "3 days ago",
    result: "loss",
  },
  {
    id: "7",
    type: "rapid",
    opponentName: "Wei Yi",
    opponentRating: 2050,
    playedAt: "4 days ago",
    result: "win",
  },
  {
    id: "8",
    type: "classical",
    opponentName: "Anatoly Karpov",
    opponentRating: 2190,
    playedAt: "4 days ago",
    result: "draw",
  },
  {
    id: "9",
    type: "bullet",
    opponentName: "Mikhail Tal",
    opponentRating: 1620,
    playedAt: "5 days ago",
    result: "win",
  },
  {
    id: "10",
    type: "blitz",
    opponentName: "Vera Menchik",
    opponentRating: 1740,
    playedAt: "5 days ago",
    result: "win",
  },
  {
    id: "11",
    type: "rapid",
    opponentName: "Viswanathan Anand",
    opponentRating: 2160,
    playedAt: "6 days ago",
    result: "loss",
  },
  {
    id: "12",
    type: "classical",
    opponentName: "Fabiano Caruana",
    opponentRating: 2210,
    playedAt: "1 week ago",
    result: "loss",
  },
  {
    id: "13",
    type: "bullet",
    opponentName: "Alexandra Kosteniuk",
    opponentRating: 1690,
    playedAt: "1 week ago",
    result: "draw",
  },
  {
    id: "14",
    type: "blitz",
    opponentName: "Levon Aronian",
    opponentRating: 2080,
    playedAt: "1 week ago",
    result: "win",
  },
  {
    id: "15",
    type: "rapid",
    opponentName: "Yifan Hou",
    opponentRating: 1920,
    playedAt: "2 weeks ago",
    result: "win",
  },
  {
    id: "16",
    type: "classical",
    opponentName: "Jose Raul Capablanca",
    opponentRating: 2230,
    playedAt: "2 weeks ago",
    result: "loss",
  },
  {
    id: "17",
    type: "bullet",
    opponentName: "Emanuel Lasker",
    opponentRating: 1580,
    playedAt: "2 weeks ago",
    result: "win",
  },
  {
    id: "18",
    type: "blitz",
    opponentName: "Alexander Alekhine",
    opponentRating: 2140,
    playedAt: "3 weeks ago",
    result: "draw",
  },
  {
    id: "19",
    type: "rapid",
    opponentName: "Mikhail Botvinnik",
    opponentRating: 2110,
    playedAt: "3 weeks ago",
    result: "win",
  },
  {
    id: "20",
    type: "classical",
    opponentName: "Paul Morphy",
    opponentRating: 2170,
    playedAt: "1 month ago",
    result: "loss",
  },
];

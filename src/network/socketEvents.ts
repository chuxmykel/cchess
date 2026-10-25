import { Color, PieceSymbol, Square } from 'chess.js';

import { GameType } from '../domain/types';

export type SeekPayload = {
  minutes: number;
  incrementSeconds: number;
  rated: boolean;
};

export type GameUserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type GameMoveSummary = {
  ply: number;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  san: string;
  captured: PieceSymbol | null;
  promotion: PieceSymbol | null;
  fenAfter: string;
  clockAfterMs: number;
};

export type GameSnapshot = {
  id: string;
  white: GameUserSummary;
  black: GameUserSummary;
  minutes: number;
  incrementSeconds: number;
  gameType: GameType;
  rated: boolean;
  status: 'active' | 'completed' | 'aborted';
  result: 'white' | 'black' | 'draw' | null;
  resultReason: GameResultReason | null;
  fen: string;
  turn: Color;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveAt: string | null;
  drawOfferedBy: Color | null;
  moves: GameMoveSummary[];
  createdAt: string;
  endedAt: string | null;
};

// Mirrors cchess-be's own GameResultReason - a closed set at the source (the
// DB column's type). null (handled separately at usage sites, as with
// `result` above) means the game hasn't ended yet.
export const GAME_RESULT_REASON = {
  CHECKMATE: 'checkmate',
  RESIGNATION: 'resignation',
  TIMEOUT: 'timeout',
  STALEMATE: 'stalemate',
  DRAW_AGREEMENT: 'draw-agreement',
  THREEFOLD_REPETITION: 'threefold-repetition',
  INSUFFICIENT_MATERIAL: 'insufficient-material',
  FIFTY_MOVE_RULE: 'fifty-move-rule',
  ABANDONMENT: 'abandonment',
  ABORT: 'abort',
} as const;

export type GameResultReason =
  (typeof GAME_RESULT_REASON)[keyof typeof GAME_RESULT_REASON];

export type MatchmakingErrorPayload = {
  message: string;
};

export type GameErrorPayload = {
  gameId: string;
  message: string;
};

// What the client sends to submit a move.
export type SubmitMovePayload = {
  gameId: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

// What the server pushes to both players after a move is applied - distinct
// from `SubmitMovePayload` (this is not an echo
// of the submitted payload, it's a full move+clock update).
export type GameMovePushPayload = {
  gameId: string;
  move: GameMoveSummary;
  fen: string;
  turn: Color;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
};

export type DrawOfferedPayload = {
  gameId: string;
  by: Color;
};

export type DrawRespondPayload = {
  gameId: string;
  accept: boolean;
};

export interface ClientToServerEvents {
  'matchmaking:seek': (payload: SeekPayload) => void;
  'matchmaking:cancel': () => void;
  'game:join': (payload: { gameId: string }) => void;
  'game:leave': (payload: { gameId: string }) => void;
  'game:move': (payload: SubmitMovePayload) => void;
  'game:resign': (payload: { gameId: string }) => void;
  'game:abort': (payload: { gameId: string }) => void;
  'game:drawOffer': (payload: { gameId: string }) => void;
  'game:drawRespond': (payload: DrawRespondPayload) => void;
  ping: (clientTimeMs: number, ack: () => void) => void;
}

export interface ServerToClientEvents {
  'game:created': (payload: GameSnapshot) => void;
  'game:state': (payload: GameSnapshot) => void;
  'game:move': (payload: GameMovePushPayload) => void;
  'game:over': (payload: GameSnapshot) => void;
  'game:drawOffered': (payload: DrawOfferedPayload) => void;
  'game:drawDeclined': (payload: { gameId: string }) => void;
  'game:error': (payload: GameErrorPayload) => void;
  'matchmaking:error': (payload: MatchmakingErrorPayload) => void;
  'auth:error': (payload: { message: string }) => void;
}

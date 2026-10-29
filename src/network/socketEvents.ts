import { Color, PieceSymbol, Square } from 'chess.js';

import { GameType } from '../domain/types';
import type { Challenge, DirectMessage, FriendRequest } from './restClient';

export type RatingRange = {
  below: number | null;
  above: number | null;
};

/** The color to play in a seek or challenge - random when you don't
 * mind. */
export type ColorChoice = 'white' | 'black' | 'random';

export type SeekPayload = {
  initialSeconds: number;
  incrementSeconds: number;
  rated: boolean;
  ratingRange: RatingRange;
  color: ColorChoice;
};

export type GameUserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  rating: number | null;
  provisional: boolean;
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

/** Each side's points across a rematch series. */
export type SeriesScore = { white: number; black: number };

export type GameSnapshot = {
  id: string;
  white: GameUserSummary;
  black: GameUserSummary;
  initialSeconds: number;
  incrementSeconds: number;
  gameType: GameType;
  rated: boolean;
  whiteRatingDiff: number | null;
  blackRatingDiff: number | null;
  status: 'active' | 'completed' | 'aborted';
  result: 'white' | 'black' | 'draw' | null;
  resultReason: GameResultReason | null;
  fen: string;
  turn: Color;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveAt: string | null;
  drawOfferedBy: Side | null;
  firstMoveDeadline: string | null;
  moves: GameMoveSummary[];
  createdAt: string;
  endedAt: string | null;
  /** When the chat stops taking messages; null while the game is on. */
  chatClosesAt: string | null;
  /** The game this one is a rematch of. */
  rematchOfId: string | null;
  /** The series score, this game included once it's over; null outside a
   * rematch series. */
  series: SeriesScore | null;
  rematchOfferedBy: 'white' | 'black' | null;
  /** The rematch, once both players agreed to it. */
  rematchGameId: string | null;
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
  /** What was refused, e.g. 'game:move'. */
  event: string;
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
  firstMoveDeadline: string | null;
};

/** A side as the server names it in draw and rematch offers - not the
 * 'w'/'b' of a Color. */
export type Side = 'white' | 'black';

/** A rematch offer made, or declined or withdrawn, by one side. */
export type RematchPayload = {
  gameId: string;
  by: Side;
};

export type DrawOfferedPayload = {
  gameId: string;
  by: Side;
};

export type DrawRespondPayload = {
  gameId: string;
  accept: boolean;
};

/** A player's own words, or a note of a draw they offered, declined or
 * accepted - which has no text of its own. */
export type ChatMessageKind =
  'message' | 'draw-offered' | 'draw-declined' | 'draw-accepted';

export type ChatMessage = {
  id: string;
  gameId: string;
  /** Who sent it - or, for a note, who did what it notes. */
  userId: string;
  kind: ChatMessageKind;
  text: string;
  createdAt: string;
};

export type ChatHistoryPayload = {
  gameId: string;
  messages: ChatMessage[];
  /** How far I've read the chat; null if I never have. */
  readAt: string | null;
};

export type GamePresencePayload = {
  gameId: string;
  userId: string;
  online: boolean;
};

export type FriendStatusPayload = {
  userId: string;
  online: boolean;
  playingGameId: string | null;
};

export type LobbyStats = {
  playersOnline: number;
  gamesInPlay: number;
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
  'game:chat': (payload: { gameId: string; text: string }) => void;
  'game:chatHistory': (payload: { gameId: string }) => void;
  'game:chatRead': (payload: { gameId: string }) => void;
  'game:watch': (payload: { gameId: string }) => void;
  'game:unwatch': (payload: { gameId: string }) => void;
  'game:rematchOffer': (payload: { gameId: string }) => void;
  'game:rematchDecline': (payload: { gameId: string }) => void;
  ping: (clientTimeMs: number, ack: () => void) => void;
}

export interface ServerToClientEvents {
  'game:created': (payload: GameSnapshot) => void;
  'game:state': (payload: GameSnapshot) => void;
  'game:move': (payload: GameMovePushPayload) => void;
  'game:over': (payload: GameSnapshot) => void;
  'game:drawOffered': (payload: DrawOfferedPayload) => void;
  'game:drawDeclined': (payload: { gameId: string }) => void;
  'game:rematchOffered': (payload: RematchPayload) => void;
  'game:rematchDeclined': (payload: RematchPayload) => void;
  'lobby:stats': (payload: LobbyStats) => void;
  'game:presence': (payload: GamePresencePayload) => void;
  'game:chat': (payload: ChatMessage) => void;
  'game:chatHistory': (payload: ChatHistoryPayload) => void;
  'game:error': (payload: GameErrorPayload) => void;
  'matchmaking:error': (payload: MatchmakingErrorPayload) => void;
  'auth:error': (payload: { message: string }) => void;
  'friend:requestReceived': (payload: FriendRequest) => void;
  'friend:requestAccepted': (payload: { id: string }) => void;
  'friend:requestResolved': (payload: { id: string }) => void;
  'friend:removed': (payload: { userIds: string[] }) => void;
  'friend:status': (payload: FriendStatusPayload) => void;
  'challenge:received': (payload: Challenge) => void;
  'challenge:accepted': (payload: Challenge) => void;
  'challenge:resolved': (payload: Challenge) => void;
  'dm:message': (payload: DirectMessage) => void;
}

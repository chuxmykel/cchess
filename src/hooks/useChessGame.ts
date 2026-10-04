import { useCallback, useReducer, useRef } from "react";
import { Color, PieceSymbol, Square } from "chess.js";

import { ChessEngine } from "../domain/ChessEngine";
import { AppliedMove, DomainPiece, MoveResult } from "../domain/types";

type PendingPromotion = { from: Square; to: Square };

type ChessGameState = {
  pieces: DomainPiece[];
  turn: Color;
  selectedSquare: Square | null;
  legalMoveSquares: Square[];
  isGameOver: boolean;
  pendingPromotion: PendingPromotion | null;
  lastMove: AppliedMove | null;
};

type Action =
  | { type: "SELECT_SQUARE"; square: Square; legalMoveSquares: Square[] }
  | { type: "DESELECT" }
  | { type: "MOVE_REJECTED" }
  | { type: "PROMOTION_PENDING"; from: Square; to: Square }
  | { type: "MOVE_APPLIED"; move: AppliedMove; pieces: DomainPiece[]; turn: Color; isGameOver: boolean };

// Pure - takes whatever the engine already computed (passed in via the
// action) rather than reaching into the engine itself, so every transition
// is a single, testable state update with no hidden mutation.
function reducer(state: ChessGameState, action: Action): ChessGameState {
  switch (action.type) {
    case "SELECT_SQUARE":
      return { ...state, selectedSquare: action.square, legalMoveSquares: action.legalMoveSquares };
    case "DESELECT":
      return { ...state, selectedSquare: null, legalMoveSquares: [] };
    case "MOVE_REJECTED":
      return { ...state, selectedSquare: null, legalMoveSquares: [] };
    case "PROMOTION_PENDING":
      return {
        ...state,
        pendingPromotion: { from: action.from, to: action.to },
        selectedSquare: null,
        legalMoveSquares: [],
      };
    case "MOVE_APPLIED":
      return {
        ...state,
        pieces: action.pieces,
        turn: action.turn,
        selectedSquare: null,
        legalMoveSquares: [],
        isGameOver: action.isGameOver,
        pendingPromotion: null,
        lastMove: action.move,
      };
    default:
      return state;
  }
}

function initState(engine: ChessEngine): ChessGameState {
  return {
    pieces: engine.getBoardSnapshot(),
    turn: engine.getTurn(),
    selectedSquare: null,
    legalMoveSquares: [],
    isGameOver: engine.isGameOver(),
    pendingPromotion: null,
    lastMove: null,
  };
}

// The single state machine for an in-progress game: owns the ChessEngine
// instance and replaces what used to be three separate, independently
// mutated pieces of state (the screen's game+pieces, the board's selection
// ref, and each drag's own tap-vs-move interpretation). Both tap-to-move and
// drag-and-drop resolve through the same `attemptMove`, so there is exactly
// one path from "user wants to move a piece" to the board changing.
export function useChessGame(fen?: string) {
  const engineRef = useRef<ChessEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new ChessEngine(fen);
  }
  const engine = engineRef.current;

  const [state, dispatch] = useReducer(reducer, engine, initState);

  // Every function below is wrapped in useCallback with an empty dependency
  // array - i.e. each keeps the exact same identity for the component's
  // whole lifetime - and reads current state through this ref instead of
  // closing over `state` directly. A selection-only dispatch (tapping a new
  // piece) doesn't change `pieces`/`turn`/etc, so without this, Chessboard's
  // re-render would still hand every one of the 32 Piece children a "new"
  // onTap/etc closure on every such dispatch, defeating React.memo on Piece
  // and forcing all 32 to re-render just to select one square - competing
  // JS-thread work that measurably delayed the drag guide's hide (visible
  // specifically on a fresh selection, since re-tapping an already-selected
  // square is a no-op with no dispatch at all, and was never delayed).
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyResult = useCallback((result: MoveResult) => {
    if (result.status === "illegal") {
      dispatch({ type: "MOVE_REJECTED" });
      return;
    }
    if (result.status === "needs-promotion-choice") {
      dispatch({ type: "PROMOTION_PENDING", from: result.from, to: result.to });
      return;
    }
    dispatch({
      type: "MOVE_APPLIED",
      move: result.move,
      pieces: engine.getBoardSnapshot(),
      turn: engine.getTurn(),
      isGameOver: engine.isGameOver(),
    });
  }, [engine]);

  const attemptMove = useCallback((from: Square, to: Square): MoveResult => {
    const result = engine.attemptMove(from, to);
    applyResult(result);
    return result;
  }, [engine, applyResult]);

  // A pure, synchronous read - unlike handleSquareTap/attemptMove, this
  // touches neither the engine's mutable move state nor the reducer, so
  // callers can use it to drive imperative Animated updates that must
  // stay in lockstep with another synchronous animation (the drag guide)
  // without waiting on a dispatch/render/effect round-trip.
  const getLegalMoveSquares = useCallback((square: Square): Square[] => {
    return engine.getLegalMoveSquares(square);
  }, [engine]);

  const isOwnPieceAt = useCallback((square: Square): boolean => {
    const piece = stateRef.current.pieces.find((candidate) => candidate.square === square);
    return Boolean(piece) && piece.color === stateRef.current.turn;
  }, []);

  const selectSquare = useCallback((square: Square) => {
    dispatch({ type: "SELECT_SQUARE", square, legalMoveSquares: engine.getLegalMoveSquares(square) });
  }, [engine]);

  const handleSquareTap = useCallback((square: Square) => {
    const current = stateRef.current;
    if (current.isGameOver) return;

    if (!current.selectedSquare) {
      if (isOwnPieceAt(square)) {
        selectSquare(square);
      }
      return;
    }

    if (square === current.selectedSquare) return;

    if (isOwnPieceAt(square)) {
      selectSquare(square);
      return;
    }

    attemptMove(current.selectedSquare, square);
  }, [isOwnPieceAt, selectSquare, attemptMove]);

  const promoteTo = useCallback((piece: PieceSymbol) => {
    const { pendingPromotion } = stateRef.current;
    if (!pendingPromotion) return;
    applyResult(engine.attemptMove(pendingPromotion.from, pendingPromotion.to, piece));
  }, [engine, applyResult]);

  return {
    pieces: state.pieces,
    turn: state.turn,
    isGameOver: state.isGameOver,
    selectedSquare: state.selectedSquare,
    legalMoveSquares: state.legalMoveSquares,
    pendingPromotion: state.pendingPromotion,
    lastMove: state.lastMove,
    isOwnPieceAt,
    getLegalMoveSquares,
    handleSquareTap,
    attemptMove,
    promoteTo,
  };
}

export type UseChessGameResult = ReturnType<typeof useChessGame>;

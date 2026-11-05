import { useCallback, useMemo, useReducer, useRef } from 'react';
import { Color, PieceSymbol, Square } from 'chess.js';

import { ChessEngine } from '../domain/ChessEngine';
import {
  AppliedMove,
  DomainPiece,
  LegalTargets,
  MoveResult,
} from '../domain/types';

type PendingPromotion = { from: Square; to: Square };

type ChessGameState = {
  pieces: DomainPiece[];
  turn: Color;
  // Where each of the side to move's pieces can go - every legal move at
  // once, so a dropped piece can be judged where it lands, on the UI thread.
  legalTargets: LegalTargets;
  isGameOver: boolean;
  pendingPromotion: PendingPromotion | null;
  lastMove: AppliedMove | null;
};

type Action =
  | { type: 'PROMOTION_PENDING'; from: Square; to: Square }
  | { type: 'PROMOTION_CANCELLED' }
  | {
      type: 'POSITION_RESET';
      pieces: DomainPiece[];
      turn: Color;
      legalTargets: LegalTargets;
      isGameOver: boolean;
    }
  | {
      type: 'MOVE_APPLIED';
      move: AppliedMove;
      pieces: DomainPiece[];
      turn: Color;
      legalTargets: LegalTargets;
      isGameOver: boolean;
    };

function reducer(state: ChessGameState, action: Action): ChessGameState {
  switch (action.type) {
    case 'PROMOTION_PENDING':
      return {
        ...state,
        pendingPromotion: { from: action.from, to: action.to },
      };
    case 'PROMOTION_CANCELLED':
      return { ...state, pendingPromotion: null };
    case 'POSITION_RESET':
      return {
        ...state,
        pieces: action.pieces,
        turn: action.turn,
        legalTargets: action.legalTargets,
        isGameOver: action.isGameOver,
        pendingPromotion: null,
        // No move took it here, so there's none to animate or send.
        lastMove: null,
      };
    case 'MOVE_APPLIED':
      return {
        ...state,
        pieces: action.pieces,
        turn: action.turn,
        legalTargets: action.legalTargets,
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
    legalTargets: engine.getLegalTargets(),
    isGameOver: engine.isGameOver(),
    pendingPromotion: null,
    lastMove: null,
  };
}

export type ChessGameOptions = {
  // Every move the game makes - tapped, dragged, promoted or played for it -
  // with the position it reached.
  onMoveApplied?: (move: AppliedMove, fen: string) => void;
};

export function useChessGame(fen?: string, options: ChessGameOptions = {}) {
  // `engineRef` follows React's own documented lazy-ref-init pattern
  // (https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents)
  // for constructing a stable instance exactly once. `stateRef` mirrors
  // the latest `state` into a ref every render so the useCallback-memoized
  // handlers below can read fresh state without needing `state` in their
  // own dependency arrays (which would change their identity on every
  // move). Both are intentional; react-hooks/refs is a
  // React-Compiler-readiness rule, not a correctness bug under React's
  // current (non-compiled) runtime - revisit this if this project ever
  // turns the compiler on.
  /* eslint-disable react-hooks/refs */
  const engineRef = useRef<ChessEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new ChessEngine(fen);
  }
  const engine = engineRef.current;

  const [state, dispatch] = useReducer(reducer, engine, initState);

  const stateRef = useRef(state);
  stateRef.current = state;
  // Always the latest, so the handlers below needn't change with it.
  const onMoveAppliedRef = useRef(options.onMoveApplied);
  onMoveAppliedRef.current = options.onMoveApplied;
  /* eslint-enable react-hooks/refs */

  const applyResult = useCallback(
    (result: MoveResult) => {
      if (result.status === 'illegal') return;
      if (result.status === 'needs-promotion-choice') {
        dispatch({
          type: 'PROMOTION_PENDING',
          from: result.from,
          to: result.to,
        });
        return;
      }
      dispatch({
        type: 'MOVE_APPLIED',
        move: result.move,
        pieces: engine.getBoardSnapshot(),
        turn: engine.getTurn(),
        legalTargets: engine.getLegalTargets(),
        isGameOver: engine.isGameOver(),
      });
      onMoveAppliedRef.current?.(result.move, engine.getFen());
    },
    [engine],
  );

  /** A move by tap or drag - or, with `promotion`, one already decided,
   * like the opponent's from the server, applied in one go rather than
   * asking for the piece. */
  const attemptMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): MoveResult => {
      const result = engine.attemptMove(from, to, promotion);
      applyResult(result);
      return result;
    },
    [engine, applyResult],
  );

  /** Puts the pawn back: no promotion after all. */
  const cancelPromotion = useCallback(() => {
    dispatch({ type: 'PROMOTION_CANCELLED' });
  }, []);

  /** Puts the board in another position, without a move - one the server
   * refused goes back this way. */
  const resetTo = useCallback(
    (fen: string) => {
      engine.load(fen);
      dispatch({
        type: 'POSITION_RESET',
        pieces: engine.getBoardSnapshot(),
        turn: engine.getTurn(),
        legalTargets: engine.getLegalTargets(),
        isGameOver: engine.isGameOver(),
      });
    },
    [engine],
  );

  const promoteTo = useCallback(
    (piece: PieceSymbol) => {
      const { pendingPromotion } = stateRef.current;
      if (!pendingPromotion) return;
      applyResult(
        engine.attemptMove(pendingPromotion.from, pendingPromotion.to, piece),
      );
    },
    [engine, applyResult],
  );

  // The same object until the game changes, so a screen re-rendering for
  // something else - an engine's lines - doesn't re-render the board under
  // ChessGameContext.
  return useMemo(
    () => ({
      pieces: state.pieces,
      // engine is engineRef.current (lazy-inited above), and `state` changes
      // whenever it does - safe under React's current non-compiled runtime,
      // see the react-hooks/refs note above.
      // eslint-disable-next-line react-hooks/refs
      fen: engine.getFen(),
      turn: state.turn,
      legalTargets: state.legalTargets,
      isGameOver: state.isGameOver,
      // Whose pieces can be picked up: the side to move's, until the game's
      // over.
      movableColor: state.isGameOver ? null : state.turn,
      pendingPromotion: state.pendingPromotion,
      lastMove: state.lastMove,
      attemptMove,
      promoteTo,
      cancelPromotion,
      resetTo,
    }),
    [state, engine, attemptMove, promoteTo, cancelPromotion, resetTo],
  );
}

export type UseChessGameResult = ReturnType<typeof useChessGame>;

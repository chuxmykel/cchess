import { useCallback, useMemo, useReducer, useRef } from 'react';

import {
  AnalysisNode,
  AnalysisTree,
  MoveSpec,
  addMove,
  deleteFrom,
  keepOnlyChild,
  lineThrough,
  pathTo,
  promoteVariation,
  toMoveListTokens,
  treeFromMoves,
} from '../domain/analysisTree';

type State = {
  tree: AnalysisTree;
  currentId: string;
  // The line being followed: Forward goes along it, so going back and then
  // forward again returns the way you came, variation or not.
  line: string[];
  // One line only: a move other than the one that followed replaces it.
  singleLine: boolean;
};

// A step to another position in the tree, without a move.
export type TreeStep =
  | { type: 'GO_TO'; id: string }
  | { type: 'BACK' }
  | { type: 'FORWARD' }
  | { type: 'TO_START' }
  | { type: 'TO_END' };

type Action =
  | { type: 'MOVE'; move: MoveSpec }
  | { type: 'PLAY_LINE'; moves: MoveSpec[] }
  | { type: 'RESET'; start: AnalysisStart }
  | TreeStep
  | { type: 'PROMOTE'; id: string }
  | { type: 'DELETE'; id: string };

function goTo(state: State, id: string): State {
  if (!state.tree.nodes[id] || id === state.currentId) return state;
  return {
    ...state,
    currentId: id,
    line: state.line.includes(id) ? state.line : lineThrough(state.tree, id),
  };
}

// A move played from the position looked at, gone to.
function play(state: State, move: MoveSpec): State {
  const { tree, currentId } = state;
  const added = addMove(tree, currentId, move);
  if (!added) return state;
  const next = state.singleLine
    ? keepOnlyChild(added.tree, currentId, added.nodeId)
    : added.tree;
  return goTo({ ...state, tree: next }, added.nodeId);
}

function reducer(state: State, action: Action): State {
  const { tree, currentId, line } = state;
  switch (action.type) {
    case 'MOVE':
      return play(state, action.move);
    case 'PLAY_LINE':
      // From the start, along the moves already there and on past them -
      // as far as the moves are legal.
      return action.moves.reduce(play, {
        ...state,
        currentId: tree.rootId,
      });
    case 'RESET':
      return init({ start: action.start, singleLine: state.singleLine });
    case 'GO_TO':
      return goTo(state, action.id);
    case 'BACK': {
      const parentId = tree.nodes[currentId].parentId;
      return parentId === null ? state : goTo(state, parentId);
    }
    case 'FORWARD': {
      const next = line[line.indexOf(currentId) + 1];
      return next ? goTo(state, next) : state;
    }
    case 'TO_START':
      return goTo(state, tree.rootId);
    case 'TO_END':
      return goTo(state, line[line.length - 1]);
    case 'PROMOTE':
      return { ...state, tree: promoteVariation(tree, action.id) };
    case 'DELETE': {
      const pruned = deleteFrom(tree, action.id);
      if (pruned === tree) return state;
      // Standing in what was deleted: back to where it branched off.
      const removed = !pruned.nodes[currentId];
      const at = removed
        ? (tree.nodes[action.id].parentId as string)
        : currentId;
      return {
        ...state,
        tree: pruned,
        currentId: at,
        line: line.every((id) => pruned.nodes[id])
          ? line
          : lineThrough(pruned, at),
      };
    }
    default:
      return state;
  }
}

export type AnalysisStart = {
  startFen: string;
  uciMoves?: string[];
  // Where to stand to begin with: after this many of `uciMoves` - all of
  // them when left out.
  initialPly?: number;
};

export type AnalysisTreeOptions = {
  /** Keep one line, no variations: a different move from a position
   * replaces the moves that followed it. */
  singleLine?: boolean;
};

function init({
  start: { startFen, uciMoves = [], initialPly },
  singleLine = false,
}: { start: AnalysisStart } & AnalysisTreeOptions): State {
  const { tree, line } = treeFromMoves(startFen, uciMoves);
  const at = Math.min(initialPly ?? line.length, line.length);
  return {
    tree,
    currentId: at > 0 ? line[at - 1] : tree.rootId,
    line: [tree.rootId, ...line],
    singleLine,
  };
}

// An analysis's moves as a tree - its main line and every variation tried -
// and the position being looked at in it.
export function useAnalysisTree(
  start: AnalysisStart,
  options: AnalysisTreeOptions = {},
) {
  const [state, dispatch] = useReducer(reducer, { start, ...options }, init);
  const { tree, currentId, line } = state;
  const current: AnalysisNode = tree.nodes[currentId];
  // The state as it is now, for `peek` - which a press calls before React
  // has rendered anything new. Written during render, as useChessGame's
  // stateRef is: safe under React's current, non-compiled runtime.
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = state;

  const recordMove = useCallback(
    (move: MoveSpec) => dispatch({ type: 'MOVE', move }),
    [],
  );
  const playLine = useCallback(
    (moves: MoveSpec[]) => dispatch({ type: 'PLAY_LINE', moves }),
    [],
  );
  const reset = useCallback(
    (start: AnalysisStart) => dispatch({ type: 'RESET', start }),
    [],
  );
  const goToId = useCallback(
    (id: string) => dispatch({ type: 'GO_TO', id }),
    [],
  );
  // Where a step would go - null where it goes nowhere - without taking it,
  // so the board can be moved there in the same render as the step.
  const peek = useCallback((step: TreeStep): AnalysisNode | null => {
    const now = stateRef.current;
    const next = reducer(now, step);
    return next.currentId === now.currentId
      ? null
      : next.tree.nodes[next.currentId];
  }, []);
  const step = useCallback((step: TreeStep) => dispatch(step), []);
  const back = useCallback(() => dispatch({ type: 'BACK' }), []);
  const forward = useCallback(() => dispatch({ type: 'FORWARD' }), []);
  const toStart = useCallback(() => dispatch({ type: 'TO_START' }), []);
  const toEnd = useCallback(() => dispatch({ type: 'TO_END' }), []);
  const promote = useCallback(
    (id: string) => dispatch({ type: 'PROMOTE', id }),
    [],
  );
  const remove = useCallback(
    (id: string) => dispatch({ type: 'DELETE', id }),
    [],
  );

  // Every position from the start to this one - what the opening is named
  // from.
  const pathFens = useMemo(
    () => pathTo(tree, currentId).map((id) => tree.nodes[id].fen),
    [tree, currentId],
  );
  const tokens = useMemo(() => toMoveListTokens(tree), [tree]);

  return {
    tree,
    current,
    pathFens,
    tokens,
    // The line followed, from the start - the whole analysis, with
    // `singleLine`.
    line,
    canGoBack: current.parentId !== null,
    canGoForward: line.indexOf(currentId) < line.length - 1,
    recordMove,
    playLine,
    reset,
    peek,
    step,
    goTo: goToId,
    back,
    forward,
    toStart,
    toEnd,
    promote,
    deleteFrom: remove,
  };
}

export type AnalysisTreeNavigation = ReturnType<typeof useAnalysisTree>;

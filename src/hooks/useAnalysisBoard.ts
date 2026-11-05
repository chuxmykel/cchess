import { useCallback, useLayoutEffect, useMemo } from 'react';

import { PlayedMove } from '../domain/lastMoveSquares';
import { AnalysisTreeNavigation, TreeStep } from './useAnalysisTree';
import { useChessGame, UseChessGameResult } from './useChessGame';

// The board of an analysis, kept on the position its tree is looking at.
// Either side moves - a move made on it goes into the tree, as a new
// variation or along one already there - and stepping through the tree
// moves the board: one move forward is played, so it animates and sounds as
// a move does; anything else puts the board in the position, sliding the
// pieces there (see GameBoard's `slideOnReset`).
//
// Its steps (`navigation`) move the board in the same render as the tree,
// as the press is handled: waiting for the tree's render to move the board
// would draw the whole screen twice before a piece moved.
export function useAnalysisBoard(
  startFen: string,
  analysis: AnalysisTreeNavigation,
): {
  game: UseChessGameResult;
  lastPlayedMove: PlayedMove | null;
  navigation: AnalysisTreeNavigation;
} {
  const { current, tree, recordMove, peek, step } = analysis;
  const game = useChessGame(startFen, {
    onMoveApplied: ({ from, to, promotionPiece }) =>
      recordMove({ from, to, promotion: promotionPiece }),
  });
  const { fen, attemptMove, resetTo } = game;

  const take = useCallback(
    (treeStep: TreeStep) => {
      const target = peek(treeStep);
      if (!target) return;
      const parent = target.parentId ? tree.nodes[target.parentId] : null;
      if (parent?.fen === fen && target.move) {
        // Played, so it's recorded - along the move already in the tree,
        // which is where the step goes.
        const { from, to, promotion } = target.move;
        attemptMove(from, to, promotion);
      } else {
        resetTo(target.fen);
        step(treeStep);
      }
    },
    [peek, step, tree, fen, attemptMove, resetTo],
  );

  // Anything else that changes the position - a variation deleted from
  // under it, say - catches the board up before the frame is drawn.
  useLayoutEffect(() => {
    if (fen === current.fen) return;
    resetTo(current.fen);
    // Only a new position to look at moves the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  const navigation = useMemo(
    () => ({
      ...analysis,
      back: () => take({ type: 'BACK' }),
      forward: () => take({ type: 'FORWARD' }),
      goTo: (id: string) => take({ type: 'GO_TO', id }),
      toStart: () => take({ type: 'TO_START' }),
      toEnd: () => take({ type: 'TO_END' }),
    }),
    [analysis, take],
  );

  return {
    game,
    // The move that led here, marked on the board - the board marks a move
    // it plays itself, but not one stepped back to.
    lastPlayedMove: current.move,
    navigation,
  };
}

import { useEffect, useLayoutEffect, useRef } from 'react';

import { AnalysisTree, pathTo, uciToMoveSpec } from '../domain/analysisTree';
import { AnalysisTreeNavigation } from './useAnalysisTree';

/** A line from the start of an analysis, as UCI moves - what the opening
 * explorer is opened on, and hands back. */
export type ExplorerLine = { startFen: string; uciMoves: string[] };

/** The line from an analysis's start to a position in it. */
export function lineTo(tree: AnalysisTree, id: string): ExplorerLine {
  return {
    startFen: tree.nodes[tree.rootId].fen,
    uciMoves: pathTo(tree, id)
      .slice(1)
      .map((nodeId) => tree.nodes[nodeId].move!.uci),
  };
}

/**
 * Goes along the line the opening explorer hands back, once it has: from
 * the analysis's start - the moves already there followed, and the rest
 * played on. A line from somewhere else - another analysis's - is left.
 * `onTaken` clears it, so it's gone along once.
 */
export function useTakeExplorerLine(
  analysis: AnalysisTreeNavigation,
  line: ExplorerLine | undefined,
  onTaken: () => void,
): void {
  const latestOnTaken = useRef(onTaken);
  useLayoutEffect(() => {
    latestOnTaken.current = onTaken;
  });
  const { tree, playLine } = analysis;
  const startFen = tree.nodes[tree.rootId].fen;

  useEffect(() => {
    if (!line) return;
    if (line.startFen === startFen) {
      playLine(line.uciMoves.map(uciToMoveSpec));
    }
    latestOnTaken.current();
  }, [line, startFen, playLine]);
}

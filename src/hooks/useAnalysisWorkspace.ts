import { useMemo } from 'react';
import { Color } from 'chess.js';

import { useAnalysisSettingsContext } from '../context/AnalysisSettingsContext';
import { openingAt } from '../domain/openings';
import { useAnalysisBoard } from './useAnalysisBoard';
import { AnalysisStart, useAnalysisTree } from './useAnalysisTree';
import { useBoardOrientation } from './useBoardOrientation';
import { useAnalysisSounds } from './useGameSounds';

/**
 * An analysis, engine or not: its moves as a tree, the board kept on the
 * position looked at in it, the board's orientation and the opening the
 * line is in - everything an analysis board shows besides an engine's view
 * of it. Moves sound as the analysis settings say.
 */
export function useAnalysisWorkspace(
  start: AnalysisStart,
  initialOrientation: Color,
) {
  const analysis = useAnalysisTree(start);
  const { game, lastPlayedMove, navigation } = useAnalysisBoard(
    start.startFen,
    analysis,
  );
  const { orientation, flip } = useBoardOrientation(initialOrientation);
  const { settings } = useAnalysisSettingsContext();
  useAnalysisSounds(analysis.current, settings.sounds);
  const opening = useMemo(
    () => openingAt(analysis.pathFens),
    [analysis.pathFens],
  );

  return {
    analysis,
    game,
    lastPlayedMove,
    steps: navigation,
    orientation,
    flip,
    opening,
  };
}

export type AnalysisWorkspace = ReturnType<typeof useAnalysisWorkspace>;

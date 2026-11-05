import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from 'chess.js';

import AnalysisView from '../../components/AnalysisView';
import { ToolbarButton } from '../../components/GameToolbar';
import NotesSheet from '../../components/NotesSheet';
import OpeningExplorerSheet from '../../components/OpeningExplorerSheet';
import { uciToMoveSpec } from '../../domain/analysisTree';
import { AnalysisStart } from '../../hooks/useAnalysisTree';
import { useAnalysisWorkspace } from '../../hooks/useAnalysisWorkspace';
import { useGameNotes } from '../../hooks/useGameNotes';
import { useOpeningExplorer } from '../../hooks/useOpeningExplorer';
import { spacing } from '../../theme';

interface DailyAnalysisContentProps {
  gameId: string;
  start: AnalysisStart;
  initialOrientation: Color;
  width: number;
  /** Back to the game as it stands now, its latest moves and all. */
  onReset: () => void;
}

// A daily game's analysis board: moves tried here stay here, never reaching
// the game - and with no engine, as a game still being played allows. Its
// toolbar has the opening explorer, your notes on the game, the board's
// flip, a reset to the game as it stands, and the steps through the moves.
const DailyAnalysisContent: React.FC<DailyAnalysisContentProps> = ({
  gameId,
  start,
  initialOrientation,
  width,
  onReset,
}) => {
  const workspace = useAnalysisWorkspace(start, initialOrientation);
  const { analysis, game, steps, flip } = workspace;
  const [sheet, setSheet] = useState<'explorer' | 'notes' | null>(null);
  const explorer = useOpeningExplorer(
    analysis.current.fen,
    sheet === 'explorer',
  );
  const notes = useGameNotes(gameId);

  function playMove(uci: string) {
    const { from, to, promotion } = uciToMoveSpec(uci);
    game.attemptMove(from, to, promotion);
  }

  return (
    <AnalysisView
      workspace={workspace}
      boardWidth={width}
      toolbar={
        <View style={styles.toolbar} testID="daily-analysis-toolbar">
          <ToolbarButton
            icon="book-open-variant"
            label="Opening explorer"
            onPress={() => setSheet('explorer')}
            testID="opening-explorer-button"
          />
          <ToolbarButton
            icon="note-text-outline"
            label="Notes"
            onPress={() => setSheet('notes')}
            testID="notes-button"
          />
          <ToolbarButton
            icon="swap-vertical"
            label="Flip board"
            onPress={flip}
            testID="flip-board-button"
          />
          <ToolbarButton
            icon="restore"
            label="Reset"
            hint="Back to the game's position"
            onPress={onReset}
            testID="reset-analysis-button"
          />
          <ToolbarButton
            icon="chevron-left"
            label="Previous move"
            onPress={steps.back}
            disabled={!steps.canGoBack}
            repeatsWhileHeld
            testID="previous-move-button"
          />
          <ToolbarButton
            icon="chevron-right"
            label="Next move"
            onPress={steps.forward}
            disabled={!steps.canGoForward}
            repeatsWhileHeld
            testID="next-move-button"
          />
        </View>
      }
      testID="daily-analysis"
    >
      <OpeningExplorerSheet
        visible={sheet === 'explorer'}
        explorer={explorer}
        onClose={() => setSheet(null)}
        onPlayMove={playMove}
      />
      <NotesSheet
        visible={sheet === 'notes'}
        notes={notes}
        onClose={() => setSheet(null)}
      />
    </AnalysisView>
  );
};

export default DailyAnalysisContent;

const styles = StyleSheet.create({
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});

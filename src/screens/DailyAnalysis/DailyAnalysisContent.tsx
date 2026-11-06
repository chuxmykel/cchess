import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from 'chess.js';

import BottomBar from '../../components/BottomBar';
import { GameBoard } from '../../components/Board';
import { ToolbarButton } from '../../components/GameToolbar';
import MoveList, { MoveListMove } from '../../components/MoveList';
import PlayerBarsFrame from '../../components/PlayerBarsFrame';
import PromotionMenu from '../../components/PromotionMenu';
import { ChessGameContext } from '../../context/ChessGameContext';
import { capturedMaterial } from '../../domain/material';
import { AnalysisStart } from '../../hooks/useAnalysisTree';
import { useAnalysisWorkspace } from '../../hooks/useAnalysisWorkspace';
import {
  ExplorerLine,
  lineTo,
  useTakeExplorerLine,
} from '../../hooks/useExplorerLine';
import { GameUserSummary } from '../../network/socketEvents';
import { makeStyles, spacing } from '../../theme';

interface DailyAnalysisContentProps {
  start: AnalysisStart;
  players: { white: GameUserSummary; black: GameUserSummary };
  /** The side you play. */
  initialOrientation: Color;
  width: number;
  /** Back to the game as it stands now, its latest moves and all. */
  onReset: () => void;
  /** Your notes on the game. */
  onOpenNotes: () => void;
  /** The opening explorer, on the line to the position shown. */
  onOpenExplorer: (line: ExplorerLine, orientation: Color) => void;
  /** The line the explorer handed back, to go along. */
  explorerLine?: ExplorerLine;
  onExplorerLineTaken: () => void;
}

// A daily game's analysis board, laid out as the game is - its moves along
// the top, the players either side of the board - with no clocks, and no
// engine, as a game still being played allows. Moves tried here stay here,
// never reaching the game: one line of them, a different move replacing
// those that followed. Its toolbar has the opening explorer, your notes on
// the game, the board's flip, a reset to the game as it stands, and the
// steps through the moves.
const DailyAnalysisContent: React.FC<DailyAnalysisContentProps> = ({
  start,
  players,
  initialOrientation,
  width,
  onReset,
  onOpenNotes,
  onOpenExplorer,
  explorerLine,
  onExplorerLineTaken,
}) => {
  const themed = useStyles();
  const workspace = useAnalysisWorkspace(start, initialOrientation, {
    singleLine: true,
  });
  const { analysis, game, lastPlayedMove, steps, orientation, flip } =
    workspace;
  useTakeExplorerLine(analysis, explorerLine, onExplorerLineTaken);

  const lineMoves = useMemo(
    () =>
      analysis.line.slice(1).map((id, index): MoveListMove => {
        const move = analysis.tree.nodes[id].move!;
        return { ply: index + 1, color: move.color, san: move.san };
      }),
    [analysis.line, analysis.tree],
  );
  const currentPly = analysis.line.indexOf(analysis.current.id);
  const material = capturedMaterial(
    analysis.current.fen,
    analysis.line.slice(1, currentPly + 1).map((id) => {
      const move = analysis.tree.nodes[id].move!;
      return { color: move.color, captured: move.captured ?? null };
    }),
  );

  return (
    <View style={themed.screen} testID="daily-analysis">
      <MoveList
        moves={lineMoves}
        currentPly={currentPly}
        onSelectPly={(ply) => steps.goTo(analysis.line[ply])}
      />

      <View style={styles.boardArea}>
        <PlayerBarsFrame
          orientation={orientation}
          material={material}
          playerBarProps={{
            ...players,
            turn: game.turn,
            isGameOver: false,
          }}
        >
          <ChessGameContext.Provider value={game}>
            <GameBoard
              width={width}
              orientation={orientation}
              lastPlayedMove={lastPlayedMove}
              slideOnReset
            />
          </ChessGameContext.Provider>
          {game.pendingPromotion && (
            <PromotionMenu
              promotingColor={game.turn}
              boardWidth={width}
              pieceWidth={width / 8}
              handlePromotion={game.promoteTo}
              onCancel={game.cancelPromotion}
            />
          )}
        </PlayerBarsFrame>
      </View>

      <BottomBar>
        <View style={styles.toolbar} testID="daily-analysis-toolbar">
          <ToolbarButton
            icon="book-open-variant"
            label="Opening explorer"
            onPress={() =>
              onOpenExplorer(
                lineTo(analysis.tree, analysis.current.id),
                orientation,
              )
            }
            testID="opening-explorer-button"
          />
          <ToolbarButton
            icon="note-edit-outline"
            label="Notes"
            onPress={onOpenNotes}
            testID="notes-button"
          />
          <ToolbarButton
            icon="rotate-3d-variant"
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
      </BottomBar>
    </View>
  );
};

export default DailyAnalysisContent;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
}));

const styles = StyleSheet.create({
  boardArea: {
    flex: 1,
  },
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});

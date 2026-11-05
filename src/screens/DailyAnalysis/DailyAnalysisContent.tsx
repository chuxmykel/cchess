import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from 'chess.js';

import BottomBar from '../../components/BottomBar';
import { GameBoard } from '../../components/Board';
import ConditionalMovePanel from '../../components/ConditionalMovePanel';
import { ToolbarButton } from '../../components/GameToolbar';
import MoveList, { MoveListMove } from '../../components/MoveList';
import NotesSheet from '../../components/NotesSheet';
import OpeningExplorerSheet from '../../components/OpeningExplorerSheet';
import PlayerBarsFrame from '../../components/PlayerBarsFrame';
import PromotionMenu from '../../components/PromotionMenu';
import { ChessGameContext } from '../../context/ChessGameContext';
import { uciToMoveSpec } from '../../domain/analysisTree';
import {
  conditionalLine,
  lineAsText,
  mainLineNodeId,
} from '../../domain/conditionalMoves';
import { capturedMaterial } from '../../domain/material';
import { useConditionalMoves } from '../../hooks/useConditionalMoves';
import { AnalysisStart } from '../../hooks/useAnalysisTree';
import { useAnalysisWorkspace } from '../../hooks/useAnalysisWorkspace';
import { useGameNotes } from '../../hooks/useGameNotes';
import { useOpeningExplorer } from '../../hooks/useOpeningExplorer';
import { GameUserSummary } from '../../network/socketEvents';
import { makeStyles, spacing } from '../../theme';

interface DailyAnalysisContentProps {
  gameId: string;
  start: AnalysisStart;
  players: { white: GameUserSummary; black: GameUserSummary };
  /** The side you play. */
  initialOrientation: Color;
  /** Whether the game's still being played - only then are conditional
   * moves saved. */
  isGameInPlay: boolean;
  width: number;
  /** Back to the game as it stands now, its latest moves and all. */
  onReset: () => void;
}

// A daily game's analysis board, laid out as the game is - its moves along
// the top, the players either side of the board - with no clocks, and no
// engine, as a game still being played allows. Moves tried here stay here,
// never reaching the game: one line of them, a different move replacing
// those that followed. Its toolbar has the opening explorer, your notes on
// the game, the board's flip, a reset to the game as it stands, and the
// steps through the moves.
const DailyAnalysisContent: React.FC<DailyAnalysisContentProps> = ({
  gameId,
  start,
  players,
  initialOrientation,
  isGameInPlay,
  width,
  onReset,
}) => {
  const themed = useStyles();
  const workspace = useAnalysisWorkspace(start, initialOrientation, {
    singleLine: true,
  });
  const { analysis, game, lastPlayedMove, steps, orientation, flip } =
    workspace;
  const [sheet, setSheet] = useState<'explorer' | 'notes' | null>(null);
  const explorer = useOpeningExplorer(
    analysis.current.fen,
    sheet === 'explorer',
  );
  const notes = useGameNotes(gameId);

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

  // The game's own position, its moves at the start of the line - gone
  // once a move before it replaces them.
  const gamePly = start.uciMoves?.length ?? 0;
  const [gameNodeId] = useState(() => mainLineNodeId(analysis.tree, gamePly));
  const gameNode = gameNodeId
    ? (analysis.tree.nodes[gameNodeId] ?? null)
    : null;
  const isOpponentToMove =
    isGameInPlay &&
    gameNode !== null &&
    gameNode.fen.split(' ')[1] !== initialOrientation;
  const line =
    isOpponentToMove && gameNodeId
      ? conditionalLine(analysis.tree, gameNodeId, analysis.current.id)
      : null;
  const conditional = useConditionalMoves(gameId);
  const isLineSaved =
    line !== null &&
    conditional.saved?.basePly === gamePly &&
    conditional.saved.lines.some((saved) =>
      line.every((move, index) => saved[index] === move),
    );
  const [isSavingLine, setIsSavingLine] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveLine() {
    if (!line) return;
    setIsSavingLine(true);
    setSaveError(null);
    try {
      await conditional.add(gamePly, [line]);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setIsSavingLine(false);
    }
  }

  function playMove(uci: string) {
    const { from, to, promotion } = uciToMoveSpec(uci);
    game.attemptMove(from, to, promotion);
  }

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
        {/* Over the room under the board, so the board never moves for it. */}
        {line && gameNode && (
          <View style={styles.conditionalPanel}>
            <ConditionalMovePanel
              line={lineAsText(gameNode.fen, line)}
              isSaved={isLineSaved}
              isSaving={isSavingLine}
              errorMessage={saveError}
              onSave={saveLine}
            />
          </View>
        )}
      </View>

      <BottomBar>
        <View style={styles.toolbar} testID="daily-analysis-toolbar">
          <ToolbarButton
            icon="book-open-variant"
            label="Opening explorer"
            onPress={() => setSheet('explorer')}
            testID="opening-explorer-button"
          />
          <ToolbarButton
            icon="note-edit-outline"
            label="Notes"
            onPress={() => setSheet('notes')}
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
  conditionalPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.sm,
  },
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});

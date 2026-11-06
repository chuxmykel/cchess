import { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomBar from '../../components/BottomBar';
import { GameBoard } from '../../components/Board';
import ConditionalLinesList from '../../components/ConditionalLinesList';
import { ToolbarButton } from '../../components/GameToolbar';
import EmptyState from '../../components/EmptyState';
import PromotionMenu from '../../components/PromotionMenu';
import { ChessGameContext } from '../../context/ChessGameContext';
import { useDailyGamePosition } from '../../context/DailyGamePositionsContext';
import { uciOf } from '../../domain/analysisTree';
import {
  ConditionalEditor,
  addLine,
  canAddLine,
  deleteLine,
  deleteMove,
  editorFrom,
  fenAfterLine,
  lastMoveOfLine,
  lineRows,
  linesToSave,
  playMove,
  selectLine,
} from '../../domain/conditionalMoves';
import { useChessGame } from '../../hooks/useChessGame';
import { useConditionalMoves } from '../../hooks/useConditionalMoves';
import { HomeStackParamList } from '../HomeStack/types';
import { makeStyles, spacing } from '../../theme';

type ConditionalMovesProps = NativeStackScreenProps<
  HomeStackParamList,
  'ConditionalMoves'
>;

// Your conditional moves in a daily game, the opponent to move: lines
// written on the board from the game's position - their move, your reply,
// theirs... - each played for you the moment they make the move it
// answers. Confirm saves them all, in place of those saved.
const ConditionalMoves: React.FC<ConditionalMovesProps> = ({
  navigation,
  route,
}) => {
  const { gameId } = route.params;
  const game = useDailyGamePosition(gameId);
  const conditional = useConditionalMoves(gameId);

  if (!game || !conditional.saved) {
    return <Loading />;
  }
  const basePly = game.moves.length;
  const saved =
    conditional.saved.basePly === basePly ? conditional.saved.lines : [];
  return (
    <ConditionalMovesEditor
      fen={game.fen}
      basePly={basePly}
      orientation={game.myColor}
      saved={saved}
      onSave={conditional.save}
      onSaved={navigation.goBack}
    />
  );
};

const Loading: React.FC = () => {
  const themed = useStyles();
  return (
    <View style={[themed.screen, styles.centred]}>
      <ActivityIndicator />
    </View>
  );
};

interface ConditionalMovesEditorProps {
  /** The game's position, the opponent to move. */
  fen: string;
  basePly: number;
  orientation: 'w' | 'b';
  saved: string[][];
  onSave: (basePly: number, lines: string[][]) => Promise<void>;
  onSaved: () => void;
}

const ConditionalMovesEditor: React.FC<ConditionalMovesEditorProps> = ({
  fen,
  basePly,
  orientation,
  saved,
  onSave,
  onSaved,
}) => {
  const themed = useStyles();
  const { width } = useWindowDimensions();
  const [editor, setEditor] = useState<ConditionalEditor>(() =>
    editorFrom(saved),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const line = editor.lines[editor.current];
  const lineFen = useMemo(() => fenAfterLine(fen, line), [fen, line]);
  const board = useChessGame(lineFen, {
    onMoveApplied: ({ from, to, promotionPiece }) =>
      setEditor((current) =>
        playMove(current, uciOf({ from, to, promotion: promotionPiece })),
      ),
  });

  // A line chosen, a move taken back: the board goes to the line's end. A
  // move played on it is there already.
  const { fen: boardFen, resetTo } = board;
  useLayoutEffect(() => {
    if (boardFen !== lineFen) resetTo(lineFen);
    // Only the line's end moving moves the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineFen]);

  const lastMove = useMemo(() => lastMoveOfLine(fen, line), [fen, line]);

  const toSave = linesToSave(editor);
  const isChanged = JSON.stringify(toSave) !== JSON.stringify(saved);
  const rows = useMemo(
    () => editor.lines.map((written) => lineRows(fen, written)),
    [editor.lines, fen],
  );
  const isEmpty = editor.lines.length === 1 && line.length === 0;

  async function confirm() {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(basePly, toSave);
      onSaved();
    } catch (saveError) {
      setError((saveError as Error).message);
      setIsSaving(false);
    }
  }

  return (
    <View style={themed.screen} testID="conditional-moves">
      <View style={{ width, height: width }}>
        <ChessGameContext.Provider value={board}>
          <GameBoard
            width={width}
            orientation={orientation}
            lastPlayedMove={lastMove}
          />
        </ChessGameContext.Provider>
        {board.pendingPromotion && (
          <PromotionMenu
            promotingColor={board.turn}
            boardWidth={width}
            pieceWidth={width / 8}
            handlePromotion={board.promoteTo}
            onCancel={board.cancelPromotion}
          />
        )}
      </View>

      {isEmpty ? (
        <View style={styles.empty}>
          <EmptyState
            illustration="branches"
            title="No conditional moves"
            message="Play their move and your reply on the board. When they play it, your reply is played for you."
            compact
            testID="conditional-moves-empty"
          />
        </View>
      ) : (
        <ConditionalLinesList
          lines={rows}
          current={editor.current}
          onSelect={(index) => setEditor((e) => selectLine(e, index))}
          onDelete={(index) => setEditor((e) => deleteLine(e, index))}
        />
      )}
      {error && (
        <Text style={themed.error} testID="conditional-moves-error">
          {error}
        </Text>
      )}

      <BottomBar>
        <View style={styles.toolbar} testID="conditional-moves-toolbar">
          <ToolbarButton
            icon="check"
            label="Confirm"
            onPress={confirm}
            disabled={!isChanged || isSaving}
            testID="confirm-conditional-moves-button"
          />
          <ToolbarButton
            icon="plus"
            label="Add line"
            onPress={() => setEditor(addLine)}
            disabled={!canAddLine(editor)}
            testID="add-conditional-line-button"
          />
          <ToolbarButton
            icon="undo-variant"
            label="Delete move"
            onPress={() => setEditor(deleteMove)}
            disabled={line.length === 0}
            testID="delete-conditional-move-button"
          />
        </View>
      </BottomBar>
    </View>
  );
};

export default ConditionalMoves;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
}));

const styles = StyleSheet.create({
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});

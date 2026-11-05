import { Pressable, Text, View } from 'react-native';
import { Color, PieceSymbol } from 'chess.js';

import { BoardPieceIcon, SetupBoard } from '../Board';
import Icon, { IconName } from '../Icon';
import { SetupError } from '../../domain/positionSetup';
import {
  EditorTool,
  PositionEditor as Editor,
} from '../../hooks/usePositionEditor';
import { makeStyles, useTheme } from '../../theme';

interface PositionEditorProps {
  editor: Editor;
  width: number;
  // The side at the bottom.
  orientation?: Color;
}

const PIECE_TYPES: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p'];
const TOOL_PIECE_SIZE = 34;

export const SETUP_ERROR_TEXT: Record<SetupError, string> = {
  'white-king': 'White needs exactly one king.',
  'black-king': 'Black needs exactly one king.',
  'pawn-on-back-rank': "Pawns can't stand on the first or last rank.",
  'too-many-pieces': 'A side can have at most 16 pieces.',
  'opponent-in-check': "The side not to move can't be in check.",
};

function isTool(tool: EditorTool, type: PieceSymbol, color: Color) {
  return typeof tool === 'object' && tool.type === type && tool.color === color;
}

// Setting up a position: the board, and the palette around it - a piece to
// put down where the board's tapped, the eraser, or the hand, to drag the
// pieces already there to another square, or off the board - each side's
// pieces by its own side of the board, the hand and the eraser on both. Each
// row is a light grey panel, so black pieces show on a dark screen. Whose
// move it is and castling are set apart (PositionSetupSheet).
const PositionEditor: React.FC<PositionEditorProps> = ({
  editor,
  width,
  orientation = 'w',
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const topColor = orientation === 'w' ? 'b' : 'w';

  const toolButton = (
    tool: EditorTool,
    selected: boolean,
    label: string,
    testID: string,
    content: React.ReactNode,
  ) => (
    <Pressable
      key={testID}
      onPress={() => editor.setTool(tool)}
      style={({ pressed }) => [
        styles.tool,
        pressed && styles.pressedTool,
        selected && styles.selectedTool,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
    >
      {content}
    </Pressable>
  );
  // The same tool in both rows, selected in both - the lower one's testID
  // marked as such, so each stays unique.
  const iconTool = (
    tool: 'move' | 'erase',
    icon: IconName,
    label: string,
    testIDSuffix: string,
  ) =>
    toolButton(
      tool,
      editor.tool === tool,
      label,
      `editor-tool-${tool === 'move' ? 'hand' : tool}${testIDSuffix}`,
      <Icon name={icon} size={26} color={colors.board.paletteIcon} />,
    );

  // Each colour's pieces, after the board's own tools: the hand, then the
  // eraser.
  const paletteRow = (color: Color, testIDSuffix: string) => (
    <View style={styles.palette}>
      {iconTool('move', 'hand-back-right-outline', 'Move', testIDSuffix)}
      {iconTool('erase', 'eraser', 'Eraser', testIDSuffix)}
      {PIECE_TYPES.map((type) =>
        toolButton(
          { type, color },
          isTool(editor.tool, type, color),
          `${color === 'w' ? 'White' : 'Black'} ${type}`,
          `editor-tool-${color}${type}`,
          <BoardPieceIcon color={color} type={type} size={TOOL_PIECE_SIZE} />,
        ),
      )}
    </View>
  );

  return (
    <View testID="position-editor">
      {paletteRow(topColor, '')}
      <SetupBoard editor={editor} width={width} orientation={orientation} />
      {paletteRow(orientation, '-bottom')}
      {editor.errors.map((error) => (
        <Text key={error} style={styles.error} testID={`editor-error-${error}`}>
          {SETUP_ERROR_TEXT[error]}
        </Text>
      ))}
    </View>
  );
};

export default PositionEditor;

const useStyles = makeStyles((t) => ({
  // One light grey panel per row - not a tile per tool, which looked like
  // more squares of the board.
  palette: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: t.spacing.xxs,
    marginHorizontal: t.spacing.sm,
    marginVertical: t.spacing.sm,
    padding: t.spacing.xs,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.board.palette,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Always there, so a tool selected keeps its size.
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pressedTool: {
    opacity: 0.7,
  },
  // Its border alone: the panel stays light grey under a black piece.
  selectedTool: {
    borderColor: t.colors.accent,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.md,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.xs,
  },
}));

import { Image, Pressable, Text, View } from 'react-native';
import { Color, PieceSymbol } from 'chess.js';

import { SetupBoard } from '../Board';
import Icon, { IconName } from '../Icon';
import { PIECES } from '../../constants';
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
// pieces by its own side of the board. Whose move it is and castling are set
// apart (PositionSetupSheet).
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
      style={[styles.tool, selected && styles.selectedTool]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
    >
      {content}
    </Pressable>
  );
  const iconTool = (tool: 'move' | 'erase', icon: IconName, label: string) =>
    toolButton(
      tool,
      editor.tool === tool,
      label,
      `editor-tool-${tool === 'move' ? 'hand' : tool}`,
      <Icon name={icon} size={26} color={colors.textSecondary} />,
    );

  // Each colour's pieces, after a tool of the board's own: the hand above,
  // the eraser below.
  const paletteRow = (color: Color, first: React.ReactNode) => (
    <View style={styles.palette}>
      {first}
      {PIECE_TYPES.map((type) =>
        toolButton(
          { type, color },
          isTool(editor.tool, type, color),
          `${color === 'w' ? 'White' : 'Black'} ${type}`,
          `editor-tool-${color}${type}`,
          <Image
            source={PIECES[`${color}${type}`]}
            style={styles.toolImage}
            fadeDuration={0}
          />,
        ),
      )}
    </View>
  );

  return (
    <View testID="position-editor">
      {paletteRow(
        topColor,
        iconTool('move', 'hand-back-right-outline', 'Move'),
      )}
      <SetupBoard editor={editor} width={width} orientation={orientation} />
      {paletteRow(orientation, iconTool('erase', 'eraser', 'Eraser'))}
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
  palette: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: t.spacing.xs,
    paddingVertical: t.spacing.sm,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTool: {
    backgroundColor: t.colors.accentSoft,
    borderWidth: 2,
    borderColor: t.colors.accent,
  },
  toolImage: {
    width: 36,
    height: 36,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.md,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.xs,
  },
}));

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  PanGestureConfig,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Color, PieceSymbol, Square } from 'chess.js';

import BoardSurface from '../ChessBoard/BoardSurface';
import Icon, { IconName } from '../Icon';
import { PIECES, TAP_MOVEMENT_THRESHOLD } from '../../constants';
import { DRAG_LIFT, DRAG_SCALE } from '../../constants/animations';
import { BOARD_THEMES } from '../../constants/boardThemes';
import { ACCENT_COLOR } from '../../constants/colors';
import {
  getSquareFromXY,
  getXYFromSquare,
  isOnBoard,
} from '../../domain/boardCoordinates';
import { SetupError } from '../../domain/positionSetup';
import {
  EditorTool,
  PositionEditor as Editor,
} from '../../hooks/usePositionEditor';

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
  const square = width / 8;
  const pieces = Object.entries(editor.setup.board) as [
    Square,
    { type: PieceSymbol; color: Color },
  ][];
  const { lifted, gesture, liftedStyle } = useEditorDrag(
    editor,
    square,
    orientation,
    editor.tool === 'move',
  );
  const topColor = orientation === 'w' ? 'b' : 'w';
  const liftedPiece = lifted ? editor.setup.board[lifted] : undefined;

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
      <Icon name={icon} size={26} color="#444" />,
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
      {/* Its own gesture root, as the game board has: it's also shown in
          a modal, outside the app's. */}
      <GestureHandlerRootView>
        <GestureDetector gesture={gesture}>
          <View style={{ width, height: width }} testID="editor-board">
            <BoardSurface
              colors={BOARD_THEMES.test}
              orientation={orientation}
              onSquarePress={editor.tapSquare}
            />
            {pieces.map(([at, piece]) => {
              const { x, y } = getXYFromSquare(at, square, orientation);
              return (
                <Image
                  key={at}
                  source={PIECES[`${piece.color}${piece.type}`]}
                  fadeDuration={0}
                  pointerEvents="none"
                  style={[
                    styles.piece,
                    { left: x, top: y, width: square, height: square },
                    at === lifted && styles.liftedFrom,
                  ]}
                  testID={`editor-piece-${at}`}
                />
              );
            })}
            {liftedPiece && (
              <Animated.Image
                source={PIECES[`${liftedPiece.color}${liftedPiece.type}`]}
                fadeDuration={0}
                pointerEvents="none"
                style={[
                  styles.piece,
                  {
                    width: square * DRAG_SCALE,
                    height: square * DRAG_SCALE,
                  },
                  liftedStyle,
                ]}
                testID="editor-lifted-piece"
              />
            )}
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
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

// The hand's drag: a piece lifted where the finger starts, drawn under it -
// bigger, and a square above it, as a piece dragged on the game board is -
// and moved to the square it's let go on, or off the board when that's off
// it. Everything after touch-down runs on the UI thread; only lifting and
// dropping reach JS.
function useEditorDrag(
  editor: Editor,
  square: number,
  orientation: Color,
  enabled: boolean,
) {
  const [lifted, setLifted] = useState<Square | null>(null);
  const start = useSharedValue({ x: 0, y: 0 });
  const finger = useSharedValue({ x: 0, y: 0 });

  // Always the latest, for the gesture's callbacks, which never change.
  const latestEditor = useRef(editor);
  useLayoutEffect(() => {
    latestEditor.current = editor;
  });
  const lift = useCallback((from: Square) => {
    if (latestEditor.current.setup.board[from]) setLifted(from);
  }, []);
  const drop = useCallback((from: Square, to: Square | null) => {
    setLifted(null);
    latestEditor.current.movePiece(from, to);
  }, []);

  const panConfig = useMemo<PanGestureConfig>(
    () => ({
      testID: 'editor-board-pan',
      enabled,
      minDistance: TAP_MOVEMENT_THRESHOLD,
      onBegin: (event) => {
        'worklet';
        start.set({ x: event.x, y: event.y });
      },
      onActivate: (event) => {
        'worklet';
        finger.set({ x: event.x, y: event.y });
        if (isOnBoard(start.get(), square)) {
          scheduleOnRN(lift, getSquareFromXY(start.get(), square, orientation));
        }
      },
      onUpdate: (event) => {
        'worklet';
        finger.set({ x: event.x, y: event.y });
      },
      onDeactivate: (event) => {
        'worklet';
        if (!isOnBoard(start.get(), square)) return;
        const at = { x: event.x, y: event.y };
        scheduleOnRN(
          drop,
          getSquareFromXY(start.get(), square, orientation),
          isOnBoard(at, square)
            ? getSquareFromXY(at, square, orientation)
            : null,
        );
      },
    }),
    [enabled, square, orientation, start, finger, lift, drop],
  );
  const gesture = usePanGesture(panConfig);

  const liftedStyle = useAnimatedStyle(() => {
    const size = square * DRAG_SCALE;
    const { x, y } = finger.get();
    return {
      left: x - size / 2,
      top: y - square * DRAG_LIFT - size / 2,
    };
  });

  return { lifted, gesture, liftedStyle };
}

const styles = StyleSheet.create({
  palette: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTool: {
    backgroundColor: '#dfe9d5',
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  toolImage: {
    width: 36,
    height: 36,
  },
  piece: {
    position: 'absolute',
  },
  liftedFrom: {
    opacity: 0,
  },
  error: {
    color: '#c62828',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});

import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { BOARD_SQUARES } from './constants';
import { getXYFromSquare } from './coordinates';
import { parsePlacement } from './fen';
import { useDragGuide } from './hooks/useDragGuide';
import { MovableSquares } from './hooks/usePieceGesture';
import { usePieceTracker } from './hooks/usePieceTracker';
import { useValidMoveIndicators } from './hooks/useValidMoveIndicators';
import {
  BoardAnimation,
  BoardArrow,
  BoardColors,
  Dests,
  KingCheck,
  Movable,
  MoveSquares,
  PieceImages,
  Square,
} from './types';

import BoardArrows from './components/BoardArrows';
import BoardSurface from './components/BoardSurface';
import LastMoveHighlight from './components/LastMoveHighlight';
import Pieces from './components/Pieces';
import PieceDragAndDropGuide from './components/PieceDragAndDropGuide';
import ValidMoveIndicators from './components/ValidMoveIndicators';

export interface ChessboardProps {
  // The position: only the FEN's placement field is read, and any placement
  // is drawn.
  fen: string;
  // The board's width and height.
  size: number;
  // Whose side of the board is at the bottom; defaults to white's.
  orientation?: 'w' | 'b';
  colors: BoardColors;
  pieceImages: PieceImages;
  // Which pieces can be picked up or tapped, and where they may go. None,
  // when left out.
  movable?: Movable | null;
  // A piece moved - dragged or tapped - to one of its `dests`, or anywhere
  // when `free`. Return false to refuse it: a dragged piece goes straight
  // back home.
  onMove?: (from: Square, to: Square) => boolean | void;
  // With `free`, a piece dragged off the board.
  onDropOff?: (square: Square) => void;
  // Any square tapped, a piece on it or not.
  onSquarePress?: (square: Square) => void;
  // The squares to mark for the last move. A new position whose lastMove is
  // new too, its first square's piece gone from there, is that move being
  // played - its pieces slide there, and a piece it took is drawn under the
  // one taking it until that lands. Any other new position is set at once,
  // unless `animation.slideOnSet`.
  lastMove?: MoveSquares | null;
  // A pawn waiting on a promotion choice, drawn on its promotion square.
  promotion?: MoveSquares | null;
  // A king in check, glowing red - tipped over once fallen.
  check?: KingCheck | null;
  arrows?: BoardArrow[];
  animation?: BoardAnimation;
  // Drawn only, not touched: no gestures, and touches pass through.
  viewOnly?: boolean;
  // Every piece has reached its square, after the board's first drawn or
  // given a new position.
  onSettled?: () => void;
  // A line for each drop, saying how it was judged - for debugging drags.
  onDragLog?: (line: string) => void;
  testID?: string;
}

type CoreProps = Omit<ChessboardProps, 'arrows'>;

const NO_ARROWS: BoardArrow[] = [];
const NO_DESTS: Dests = {};
const NO_SQUARES: Square[] = [];
const DEFAULT_ANIMATION: BoardAnimation = {};

// Everything but the arrows - which change as often as an engine reports,
// while this only changes with the position.
const BoardCore = memo(function BoardCore({
  fen,
  size,
  orientation = 'w',
  colors,
  pieceImages,
  movable = null,
  onMove,
  onDropOff,
  onSquarePress,
  lastMove = null,
  promotion = null,
  check = null,
  animation = DEFAULT_ANIMATION,
  viewOnly = false,
  onSettled,
  onDragLog,
  testID = 'chessboard',
}: CoreProps) {
  const squareSize = size / BOARD_SQUARES;
  const [placement = ''] = fen.trim().split(/\s+/);
  const pieces = useMemo(() => parsePlacement(placement), [placement]);
  const trackedPieces = usePieceTracker({
    pieces,
    lastMove,
    squareSize,
    promotion,
    animate: animation.enabled ?? true,
    slideOnSet: animation.slideOnSet ?? false,
    onSettled,
  });
  const dragGuide = useDragGuide();

  const movableColor = viewOnly ? null : (movable?.color ?? null);
  const free = movable?.free ?? false;
  const dests = movable?.dests ?? NO_DESTS;
  const isMovableAt = useCallback(
    (square: Square) => {
      const piece = pieces.find((candidate) => candidate.square === square);
      return (
        Boolean(piece) &&
        movableColor !== null &&
        (movableColor === 'both' || piece.color === movableColor)
      );
    },
    [pieces, movableColor],
  );

  // For a drop to be judged where it lands, on the UI thread.
  const destsOnUI = useSharedValue(dests);
  useLayoutEffect(() => {
    destsOnUI.set(dests);
  }, [destsOnUI, dests]);
  // Whose pieces can be picked up, for the pieces' gestures to read on the
  // UI thread: as props, a move changing it would re-render all 32.
  const movableOnUI = useSharedValue<MovableSquares>({});
  useLayoutEffect(() => {
    movableOnUI.set(
      Object.fromEntries(
        pieces.map(({ square }) => [square, isMovableAt(square)]),
      ),
    );
  }, [movableOnUI, pieces, isMovableAt]);

  // The piece tapped to show its moves - only while the position it was
  // tapped in stands, and it can still move.
  const [selection, setSelection] = useState<{
    placement: string;
    square: Square;
  } | null>(null);
  const selected =
    selection &&
    selection.placement === placement &&
    isMovableAt(selection.square)
      ? selection.square
      : null;
  const selectedDests = useMemo(
    () => (selected && dests[selected]) ?? NO_SQUARES,
    [selected, dests],
  );
  const validMoveIndicators = useValidMoveIndicators(selectedDests);
  const { showFor } = validMoveIndicators;

  // What the pieces' callbacks call, as it is now. The callbacks themselves
  // never change: an app hands over new functions every time it renders, and
  // a piece given a new callback re-renders - and re-rendering a piece makes
  // Gesture Handler set its gestures up again, cancelling a drag under way.
  const latest = useRef({
    placement,
    selected,
    dests,
    free,
    movableColor,
    isMovableAt,
    onMove,
    onDropOff,
    onSquarePress,
    onDragLog,
    showFor,
    trackedPieces,
    squareSize,
  });
  useLayoutEffect(() => {
    latest.current = {
      placement,
      selected,
      dests,
      free,
      movableColor,
      isMovableAt,
      onMove,
      onDropOff,
      onSquarePress,
      onDragLog,
      showFor,
      trackedPieces,
      squareSize,
    };
  });

  // Tap-to-move: a tap on a piece that can move selects it, showing its
  // moves; a tap on one of them then plays it; any other tap lets go.
  const handleTap = useCallback((square: Square) => {
    const now = latest.current;
    now.onSquarePress?.(square);
    if (now.movableColor === null) return;
    const select = (at: Square | null) =>
      setSelection(at && { placement: now.placement, square: at });
    if (!now.selected) {
      if (now.isMovableAt(square)) select(square);
      return;
    }
    if (square === now.selected) return;
    if (now.isMovableAt(square)) {
      select(square);
      return;
    }
    if (now.free || now.dests[now.selected]?.includes(square)) {
      now.onMove?.(now.selected, square);
    }
    select(null);
  }, []);

  const handleDragStart = useCallback((square: Square) => {
    const now = latest.current;
    now.showFor(now.dests[square] ?? NO_SQUARES);
  }, []);

  // A piece a drop took is hidden until the board moves on from that move -
  // made, or refused and the board put back.
  const { taken } = dragGuide;
  useLayoutEffect(() => {
    const drop = taken.get();
    if (drop && (lastMove?.from !== drop.from || lastMove?.to !== drop.to)) {
      taken.set(null);
    }
  }, [taken, lastMove?.from, lastMove?.to]);
  // Nor while a pawn waits on its promotion: the piece it would take shows
  // under it until it's played.
  useLayoutEffect(() => {
    if (promotion) taken.set(null);
  }, [taken, promotion]);

  const handleDragRelease = useCallback(
    (from: Square, to: Square | null, isMove: boolean) => {
      const now = latest.current;
      now.showFor(NO_SQUARES);
      setSelection(null);
      if (!isMove || !to) {
        if (!to && now.free) now.onDropOff?.(from);
        return;
      }
      if (now.onMove?.(from, to) !== false) return;
      // Refused after all: whatever the drop took is back, and the piece -
      // set down there already - goes home at once.
      taken.set(null);
      const dragged = now.trackedPieces.find((piece) => piece.square === from);
      if (dragged) {
        const home = getXYFromSquare(from, now.squareSize);
        dragged.x.set(home.x);
        dragged.y.set(home.y);
      }
    },
    [taken],
  );

  const handleDragLog = useCallback((line: string) => {
    latest.current.onDragLog?.(line);
  }, []);

  return (
    <>
      <BoardSurface
        colors={colors}
        orientation={orientation}
        onSquarePress={viewOnly ? undefined : handleTap}
      />

      <LastMoveHighlight
        move={lastMove}
        squareWidth={squareSize}
        orientation={orientation}
        color={colors.lastMove}
      />

      {!viewOnly && (
        <>
          <PieceDragAndDropGuide
            boardWidth={size}
            squareWidth={squareSize}
            guide={dragGuide}
            colors={colors}
          />
          <ValidMoveIndicators
            pieceWidth={squareSize}
            orientation={orientation}
            opacities={validMoveIndicators.opacities}
            color={colors.moveHint}
          />
        </>
      )}

      {/* The pieces are placed from white's side; for black, the whole layer
          is turned round - in the same frame as the squares, since it's
          plain style rather than each piece's position catching up. */}
      <View
        pointerEvents={viewOnly ? 'none' : 'box-none'}
        style={[StyleSheet.absoluteFill, orientation === 'b' && styles.turned]}
        testID={`${testID}-pieces`}
      >
        <Pieces
          pieces={trackedPieces}
          pieceWidth={squareSize}
          orientation={orientation}
          pieceImages={pieceImages}
          kingInDanger={check}
          dangerColor={colors.check}
          viewOnly={viewOnly}
          movable={movableOnUI}
          dests={destsOnUI}
          free={free}
          dragGuide={dragGuide}
          onTap={handleTap}
          onDragStart={handleDragStart}
          onDragRelease={handleDragRelease}
          onDragLog={onDragLog ? handleDragLog : undefined}
        />
      </View>
    </>
  );
});

// A chessboard that draws a position and lets its pieces be moved - by tap
// or drag - where `movable` allows, without knowing the rules of chess:
// which moves are legal, and what a move does to the position, are for
// whoever renders it to say, through `movable.dests` and a new `fen`.
//
// A screen around the board can re-render often - a game's clock ticks ten
// times a second - and the board needn't follow it: it re-renders for its
// own props alone, so give it the same objects and callbacks until they
// change.
const Chessboard: React.FC<ChessboardProps> = ({
  arrows = NO_ARROWS,
  ...props
}) => {
  const { size, orientation = 'w', viewOnly = false } = props;
  const testID = props.testID ?? 'chessboard';
  const content = (
    <>
      <BoardCore {...props} testID={testID} />
      <BoardArrows
        arrows={arrows}
        boardWidth={size}
        orientation={orientation}
      />
    </>
  );
  // A board that's touched has its own root for its pieces' gestures, so it
  // works wherever it's rendered, as Gesture Handler suggests for a
  // component that uses them.
  return viewOnly ? (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
      testID={testID}
    >
      {content}
    </View>
  ) : (
    <GestureHandlerRootView
      style={{ width: size, height: size }}
      testID={testID}
    >
      {content}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  turned: {
    transform: [{ rotate: '180deg' }],
  },
});

export default memo(Chessboard);

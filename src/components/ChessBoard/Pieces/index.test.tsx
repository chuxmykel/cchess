import { render, within } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { makeMutable } from 'react-native-reanimated';
import { Square } from 'chess.js';

import Pieces from '.';
import { AnimatedPieceView } from '../../../hooks/usePieceAnimations';
import { getXYFromSquare } from '../../../domain/boardCoordinates';
import { KingInDanger } from '../../../domain/types';
import { dragPiece, tapPiece } from '../../../testUtils/pieceGestures';

describe('Pieces', () => {
  const pieceWidth = 50;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function buildPiece(
    square: Square,
    spriteId: AnimatedPieceView['spriteId'],
    captured?: boolean,
  ): AnimatedPieceView {
    const position = getXYFromSquare(square, pieceWidth);
    return {
      id: `${spriteId}-${square}`,
      spriteId,
      square,
      x: makeMutable(position.x),
      y: makeMutable(position.y),
      captured,
    };
  }

  async function renderPieces(
    overrides: Partial<{
      pieces: AnimatedPieceView[];
      // Whether e2's piece can be picked up.
      movable: boolean;
      locked: boolean;
      kingInDanger: KingInDanger | null;
    }> = {},
  ) {
    const pieces = overrides.pieces ?? [buildPiece('e2', 'wp')];
    const movable = makeMutable({ e2: overrides.movable ?? true });
    const locked = overrides.locked ?? false;
    const onTap = jest.fn();
    const onDragStart = jest.fn();
    const onDragRelease = jest.fn();

    const screen = await render(
      <GestureHandlerRootView>
        <Pieces
          pieces={pieces}
          pieceWidth={pieceWidth}
          orientation="w"
          movable={movable}
          locked={locked}
          kingInDanger={overrides.kingInDanger ?? null}
          legalTargets={makeMutable({ e2: ['e3', 'e4'] as Square[] })}
          dragGuide={{
            x: makeMutable(0),
            y: makeMutable(0),
            opacity: makeMutable(0),
            origin: makeMutable<{ x: number; y: number } | null>(null),
            taken: makeMutable(null),
          }}
          onTap={onTap}
          onDragStart={onDragStart}
          onDragRelease={onDragRelease}
        />
      </GestureHandlerRootView>,
    );

    return { screen, onTap, onDragStart, onDragRelease };
  }

  it('should exist', () => {
    expect(Pieces).toBeDefined();
  });

  it('renders one Piece per entry, by its square', async () => {
    const pieces = [buildPiece('e2', 'wp'), buildPiece('e7', 'bp')];
    const { screen } = await renderPieces({ pieces });

    expect(screen.getByTestId('piece-e2')).toBeDefined();
    expect(screen.getByTestId('piece-e7')).toBeDefined();
  });

  it('renders a piece just taken apart from the piece taking it, on the same square', async () => {
    const pieces = [buildPiece('d5', 'bp', true), buildPiece('d5', 'wp')];
    const { screen } = await renderPieces({ pieces });

    expect(screen.getByTestId('taken-piece-d5')).toBeDefined();
    expect(screen.getByTestId('piece-d5')).toBeDefined();
  });

  it('enables dragging a piece the board says can be picked up', async () => {
    const { onDragStart } = await renderPieces({
      movable: true,
      locked: false,
    });

    await dragPiece('piece-e2', 0, -100);

    expect(onDragStart).toHaveBeenCalledWith('e2');
  });

  it("disables dragging a piece the board says can't be picked up", async () => {
    const { onDragStart } = await renderPieces({
      movable: false,
    });

    await dragPiece('piece-e2', 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it("disables dragging every piece while locked, even the player's own", async () => {
    const { onDragStart } = await renderPieces({
      movable: true,
      locked: true,
    });

    await dragPiece('piece-e2', 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it("still lets a locked or opponent's piece be tapped", async () => {
    const { onTap } = await renderPieces({
      movable: false,
      locked: true,
    });

    await tapPiece('piece-e2');

    expect(onTap).toHaveBeenCalledWith('e2');
  });

  it('makes only the king in check glow', async () => {
    const { screen } = await renderPieces({
      pieces: [buildPiece('e1', 'wk'), buildPiece('e8', 'bk')],
      kingInDanger: { square: 'e1', fallen: false },
    });

    const checked = within(screen.getByTestId('piece-e1'));
    const other = within(screen.getByTestId('piece-e8'));
    expect(checked.getAllByTestId('danger-glow').length).toBeGreaterThan(0);
    expect(other.queryByTestId('danger-glow')).toBeNull();
  });

  it("doesn't make a piece just taken glow from the king's square", async () => {
    const { screen } = await renderPieces({
      pieces: [buildPiece('e1', 'wq', true), buildPiece('e1', 'wk')],
      kingInDanger: { square: 'e1', fallen: false },
    });

    const taken = within(screen.getByTestId('taken-piece-e1'));
    expect(taken.queryByTestId('danger-glow')).toBeNull();
  });
});

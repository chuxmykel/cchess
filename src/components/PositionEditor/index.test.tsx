import { fireEvent, render, within } from '@testing-library/react-native';

import PositionEditor from '.';
import { usePositionEditor } from '../../hooks/usePositionEditor';
import { dragPiece, tapPiece } from '../../testUtils/pieceGestures';

const WIDTH = 400;
const SQUARE = WIDTH / 8;

function Editor({ fen }: { fen: string }) {
  const editor = usePositionEditor(fen);
  return <PositionEditor editor={editor} width={WIDTH} />;
}

describe('PositionEditor', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function renderEditor(fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1') {
    const screen = await render(<Editor fen={fen} />);
    const board = () => within(screen.getByTestId('editor-board'));
    return { screen, board };
  }

  it('drags a piece to another square with the hand', async () => {
    const { screen, board } = await renderEditor();
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    // e1 to d3: a file left, two ranks up.
    await dragPiece('piece-e1', -SQUARE, -2 * SQUARE);

    expect(board().queryByTestId('piece-e1')).toBeNull();
    expect(board().getByTestId('piece-d3')).toBeTruthy();
  });

  it("drops a piece on another, of either side, in that one's place", async () => {
    const { screen, board } = await renderEditor(
      '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
    );
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    // The king onto its own rook on e2.
    await dragPiece('piece-e1', 0, -SQUARE);

    expect(board().queryByTestId('piece-e1')).toBeNull();
    expect(board().getAllByTestId('piece-e2')).toHaveLength(1);
    // The king, not the rook: white still has one.
    expect(screen.queryByTestId('editor-error-white-king')).toBeNull();
  });

  it('takes a piece dragged off the board away', async () => {
    const { screen, board } = await renderEditor();
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    // e8 up and off the top of the board.
    await dragPiece('piece-e8', 0, -2 * SQUARE);

    expect(board().queryByTestId('piece-e8')).toBeNull();
    expect(screen.getByTestId('editor-error-black-king')).toBeTruthy();
  });

  it("doesn't drag unless the hand is picked", async () => {
    const { board } = await renderEditor();

    await dragPiece('piece-e1', -SQUARE, -2 * SQUARE);

    expect(board().getByTestId('piece-e1')).toBeTruthy();
    expect(board().queryByTestId('piece-d3')).toBeNull();
  });

  it.each(['hand', 'erase'])(
    'offers the %s in both rows, picked in both from either',
    async (tool) => {
      const { screen } = await renderEditor();

      await fireEvent.press(screen.getByTestId(`editor-tool-${tool}-bottom`));

      expect(screen.getByTestId(`editor-tool-${tool}`)).toBeSelected();
      expect(screen.getByTestId(`editor-tool-${tool}-bottom`)).toBeSelected();

      await fireEvent.press(screen.getByTestId('editor-tool-wq'));

      expect(screen.getByTestId(`editor-tool-${tool}`)).not.toBeSelected();
      expect(
        screen.getByTestId(`editor-tool-${tool}-bottom`),
      ).not.toBeSelected();
    },
  );

  it("drags with the lower row's hand too", async () => {
    const { screen, board } = await renderEditor();
    await fireEvent.press(screen.getByTestId('editor-tool-hand-bottom'));

    await dragPiece('piece-e1', -SQUARE, -2 * SQUARE);

    expect(board().getByTestId('piece-d3')).toBeTruthy();
  });

  it('places the picked piece where the board is tapped', async () => {
    const { screen, board } = await renderEditor();

    await fireEvent.press(screen.getByTestId('editor-tool-bq'));
    await fireEvent.press(screen.getByTestId('square-d4'));

    expect(board().getByTestId('piece-d4')).toBeTruthy();
  });

  it('erases a piece tapped with the eraser', async () => {
    const { screen, board } = await renderEditor(
      '4k3/8/8/8/3q4/8/8/4K3 w - - 0 1',
    );

    await fireEvent.press(screen.getByTestId('editor-tool-erase'));
    await tapPiece('piece-d4');

    expect(board().queryByTestId('piece-d4')).toBeNull();
  });
});

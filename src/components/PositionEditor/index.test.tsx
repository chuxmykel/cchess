import { fireEvent, render } from '@testing-library/react-native';

import PositionEditor from '.';
import { boardTester } from '../Board/boardTester';
import { usePositionEditor } from '../../hooks/usePositionEditor';

const WIDTH = 400;

function Editor({ fen }: { fen: string }) {
  const editor = usePositionEditor(fen);
  return <PositionEditor editor={editor} width={WIDTH} />;
}

describe('PositionEditor', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function renderEditor(fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1') {
    const screen = await render(<Editor fen={fen} />);
    return { screen, board: boardTester(screen, 'setup') };
  }

  it('drags a piece to another square with the hand', async () => {
    const { screen, board } = await renderEditor();
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    await board.drag('e1', 'd3');

    expect(board.pieceOn('e1')).toBeNull();
    expect(board.pieceOn('d3')).toBe('wk');
  });

  it("drops a piece on another, of either side, in that one's place", async () => {
    const { screen, board } = await renderEditor(
      '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
    );
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    // The king onto its own rook on e2.
    await board.drag('e1', 'e2');

    expect(board.pieceOn('e1')).toBeNull();
    expect(board.pieceOn('e2')).toBe('wk');
    expect(screen.queryByTestId('editor-error-white-king')).toBeNull();
  });

  it('takes a piece dragged off the board away', async () => {
    const { screen, board } = await renderEditor();
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    await board.dragOff('e8');

    expect(board.pieceOn('e8')).toBeNull();
    expect(screen.getByTestId('editor-error-black-king')).toBeTruthy();
  });

  it("doesn't drag unless the hand is picked", async () => {
    const { board } = await renderEditor();

    await board.drag('e1', 'd3');

    expect(board.pieceOn('e1')).toBe('wk');
    expect(board.pieceOn('d3')).toBeNull();
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

    await board.drag('e1', 'd3');

    expect(board.pieceOn('d3')).toBe('wk');
  });

  it('places the picked piece where the board is tapped', async () => {
    const { screen, board } = await renderEditor();

    await fireEvent.press(screen.getByTestId('editor-tool-bq'));
    await board.tap('d4');

    expect(board.pieceOn('d4')).toBe('bq');
  });

  it('erases a piece tapped with the eraser', async () => {
    const { screen, board } = await renderEditor(
      '4k3/8/8/8/3q4/8/8/4K3 w - - 0 1',
    );

    await fireEvent.press(screen.getByTestId('editor-tool-erase'));
    await board.tap('d4');

    expect(board.pieceOn('d4')).toBeNull();
  });
});

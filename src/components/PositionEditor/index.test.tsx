import { act, fireEvent, render } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

import PositionEditor from '.';
import { usePositionEditor } from '../../hooks/usePositionEditor';
import { settleAnimations } from '../../testUtils/pieceGestures';

const WIDTH = 400;
// A square's middle, by its column and row from the top left (white at the
// bottom), in the board's own coordinates.
const at = (column: number, row: number) => ({
  x: column * 50 + 25,
  y: row * 50 + 25,
});

function Editor({ fen }: { fen: string }) {
  const editor = usePositionEditor(fen);
  return <PositionEditor editor={editor} width={WIDTH} />;
}

describe('PositionEditor', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function drag(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    await act(() =>
      fireGestureHandler(getByGestureTestId('editor-board-pan'), [
        { state: State.BEGAN, ...from },
        { state: State.ACTIVE, ...from },
        { state: State.ACTIVE, ...to },
        { state: State.END, ...to },
      ]),
    );
    await settleAnimations(16);
  }

  it('drags a piece to another square with the hand', async () => {
    const screen = await render(<Editor fen="4k3/8/8/8/8/8/8/4K3 w - - 0 1" />);
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    // e1 to d3.
    await drag(at(4, 7), at(3, 5));

    expect(screen.queryByTestId('editor-piece-e1')).toBeNull();
    expect(screen.getByTestId('editor-piece-d3')).toBeTruthy();
    expect(screen.queryByTestId('editor-lifted-piece')).toBeNull();
  });

  it('takes a piece dragged off the board away', async () => {
    const screen = await render(<Editor fen="4k3/8/8/8/8/8/8/4K3 w - - 0 1" />);
    await fireEvent.press(screen.getByTestId('editor-tool-hand'));

    await drag(at(4, 0), { x: 200, y: WIDTH + 60 });

    expect(screen.queryByTestId('editor-piece-e8')).toBeNull();
    expect(screen.getByTestId('editor-error-black-king')).toBeTruthy();
  });

  it("doesn't drag unless the hand is picked", async () => {
    const screen = await render(<Editor fen="4k3/8/8/8/8/8/8/4K3 w - - 0 1" />);

    await drag(at(4, 7), at(3, 5));

    expect(screen.getByTestId('editor-piece-e1')).toBeTruthy();
  });

  it('places the picked piece where the board is tapped', async () => {
    const screen = await render(<Editor fen="4k3/8/8/8/8/8/8/4K3 w - - 0 1" />);

    await fireEvent.press(screen.getByTestId('editor-tool-bq'));
    await fireEvent.press(screen.getByTestId('square-d4'));

    expect(screen.getByTestId('editor-piece-d4')).toBeTruthy();
  });
});

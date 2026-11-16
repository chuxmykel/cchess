import { fireEvent, render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import MoveList from '.';
import { GameMoveSummary } from '../../network/socketEvents';

function move(ply: number, san: string): GameMoveSummary {
  return {
    ply,
    from: 'e2',
    to: 'e4',
    piece: 'p',
    color: ply % 2 === 1 ? 'w' : 'b',
    san,
    captured: null,
    promotion: null,
    fenAfter: '',
    clockAfterMs: 300000,
  };
}

const THREE_MOVES = [move(1, 'e4'), move(2, 'e5'), move(3, 'Nf3')];

describe('MoveList', () => {
  it('numbers each white move and lists every move in order', async () => {
    const screen = await render(
      <MoveList moves={THREE_MOVES} currentPly={3} onSelectPly={jest.fn()} />,
    );

    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
    expect(screen.getByText('e4')).toBeTruthy();
    expect(screen.getByText('e5')).toBeTruthy();
    expect(screen.getByText('Nf3')).toBeTruthy();
  });

  it('highlights the current move only', async () => {
    const screen = await render(
      <MoveList moves={THREE_MOVES} currentPly={2} onSelectPly={jest.fn()} />,
    );

    expect(screen.getByTestId('move-2')).toBeSelected();
    expect(screen.getByTestId('move-1')).not.toBeSelected();
    expect(screen.getByTestId('move-3')).not.toBeSelected();
  });

  it('reports the move that was tapped', async () => {
    const onSelectPly = jest.fn();
    const screen = await render(
      <MoveList moves={THREE_MOVES} currentPly={3} onSelectPly={onSelectPly} />,
    );

    await fireEvent.press(screen.getByTestId('move-1'));

    expect(onSelectPly).toHaveBeenCalledWith(1);
  });

  it('renders an empty row before any move', async () => {
    const screen = await render(
      <MoveList moves={[]} currentPly={0} onSelectPly={jest.fn()} />,
    );

    expect(screen.getByTestId('move-list')).toBeTruthy();
    expect(screen.queryByTestId(/^move-\d/)).toBeNull();
  });

  it("marks a review's standouts and slips, not its ordinary moves", async () => {
    const screen = await render(
      <MoveList
        moves={THREE_MOVES}
        currentPly={3}
        onSelectPly={jest.fn()}
        moveClasses={{ 1: 'book', 2: 'best', 3: 'blunder' }}
      />,
    );

    expect(screen.getByTestId('move-class-book')).toBeTruthy();
    expect(screen.queryByTestId('move-class-best')).toBeNull();
    expect(screen.getByTestId('move-class-blunder')).toBeTruthy();
  });

  it('lists items after the last move, the selected one set off', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <MoveList
        moves={THREE_MOVES}
        currentPly={0}
        onSelectPly={jest.fn()}
        endItems={[
          {
            key: 'opening',
            icon: 'book-open-page-variant',
            label: 'Opening',
            selected: true,
            onPress: jest.fn(),
          },
          {
            key: 'tactics',
            icon: 'target',
            label: 'Tactics',
            selected: false,
            onPress,
          },
        ]}
      />,
    );

    expect(screen.getByTestId('move-list-end-opening')).toBeSelected();
    expect(screen.getByTestId('move-list-end-tactics')).not.toBeSelected();
    await fireEvent.press(screen.getByTestId('move-list-end-tactics'));
    expect(onPress).toHaveBeenCalled();
  });

  // A move played comes into view - even when it's laid out after the list
  // has re-rendered for it, as it can be on iOS, by which time there was
  // nowhere yet to scroll to.
  it('scrolls to a new move once it has been laid out', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    const layOut = async (
      screen: Awaited<ReturnType<typeof render>>,
      ply: number,
      x: number,
    ) =>
      fireEvent(screen.getByTestId(`move-${ply}`), 'layout', {
        nativeEvent: { layout: { x, y: 0, width: 80, height: 32 } },
      });
    const twoMoves = THREE_MOVES.slice(0, 2);
    const screen = await render(
      <MoveList moves={twoMoves} currentPly={2} onSelectPly={jest.fn()} />,
    );
    await layOut(screen, 1, 60);
    await layOut(screen, 2, 160);
    scrollTo.mockClear();

    await screen.rerender(
      <MoveList moves={THREE_MOVES} currentPly={3} onSelectPly={jest.fn()} />,
    );
    await layOut(screen, 3, 260);

    // Kept 48pt in from the list's left edge.
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 212, animated: true });
    scrollTo.mockRestore();
  });

  it('goes through the moves as it is scrolled by hand', async () => {
    const onScrub = jest.fn();
    const onScrubbingChange = jest.fn();
    const screen = await render(
      <MoveList
        moves={THREE_MOVES}
        currentPly={1}
        onSelectPly={jest.fn()}
        onScrub={onScrub}
        onScrubbingChange={onScrubbingChange}
      />,
    );
    // The moves laid out 100pt apart, from 60.
    for (const [ply, x] of [
      [1, 60],
      [2, 160],
      [3, 260],
    ]) {
      await fireEvent(screen.getByTestId(`move-${ply}`), 'layout', {
        nativeEvent: { layout: { x, y: 0, width: 80, height: 32 } },
      });
    }
    const list = screen.getByTestId('move-list');
    const scrollTo = (x: number) =>
      fireEvent.scroll(list, { nativeEvent: { contentOffset: { x, y: 0 } } });

    await fireEvent(list, 'scrollBeginDrag');
    expect(onScrubbingChange).toHaveBeenLastCalledWith(true);
    // The spot the current move's kept at is 48pt in.
    await scrollTo(120);
    expect(onScrub).toHaveBeenLastCalledWith(1);
    await scrollTo(220);
    expect(onScrub).toHaveBeenLastCalledWith(2);
    // Before the first move: the start.
    await scrollTo(0);
    expect(onScrub).toHaveBeenLastCalledWith(-1);

    await fireEvent(list, 'scrollEndDrag', {
      nativeEvent: { velocity: { x: 0, y: 0 } },
    });
    expect(onScrubbingChange).toHaveBeenLastCalledWith(false);
    // Scrolled by the app after that, not by hand: nothing more.
    onScrub.mockClear();
    await scrollTo(220);
    expect(onScrub).not.toHaveBeenCalled();
  });
});

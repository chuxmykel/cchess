import { fireEvent, render, within } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import VariationMoveList from '.';
import { MoveListToken } from '../../domain/analysisTree';

// 1. e4 e5 (1... c5) 2. Nf3
const TOKENS: MoveListToken[] = [
  { kind: 'move', nodeId: '1', san: 'e4', label: '1.', depth: 0 },
  { kind: 'move', nodeId: '2', san: 'e5', label: null, depth: 0 },
  { kind: 'open', depth: 1 },
  { kind: 'move', nodeId: '4', san: 'c5', label: '1...', depth: 1 },
  { kind: 'close', depth: 1 },
  { kind: 'move', nodeId: '3', san: 'Nf3', label: '2.', depth: 0 },
];

describe('VariationMoveList', () => {
  async function renderList(currentId = '3') {
    const onSelect = jest.fn();
    const onLongPress = jest.fn();
    const screen = await render(
      <VariationMoveList
        tokens={TOKENS}
        currentId={currentId}
        onSelect={onSelect}
        onLongPress={onLongPress}
      />,
    );
    return { screen, onSelect, onLongPress };
  }

  it('reads as the moves go, the variation in brackets', async () => {
    const { screen } = await renderList();

    expect(screen.getByText('1. e4')).toBeTruthy();
    expect(screen.getByText('e5')).toBeTruthy();
    expect(screen.getByText('1... c5')).toBeTruthy();
    expect(screen.getByText('(')).toBeTruthy();
    expect(screen.getByText(')')).toBeTruthy();
  });

  it('marks the move on the board', async () => {
    const { screen } = await renderList('4');

    expect(
      screen.getByTestId('analysis-move-4').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      screen.getByTestId('analysis-move-3').props.accessibilityState,
    ).toEqual({ selected: false });
  });

  it('goes to a move tapped, and opens its menu on a long press', async () => {
    const { screen, onSelect, onLongPress } = await renderList();

    await fireEvent.press(screen.getByTestId('analysis-move-2'));
    await fireEvent(screen.getByTestId('analysis-move-4'), 'longPress');

    expect(onSelect).toHaveBeenCalledWith('2');
    expect(onLongPress).toHaveBeenCalledWith('4');
  });

  it('asks for a move before there are any', async () => {
    const screen = await render(
      <VariationMoveList
        tokens={[]}
        currentId="0"
        onSelect={jest.fn()}
        onLongPress={jest.fn()}
      />,
    );

    expect(
      within(screen.getByTestId('variation-move-list')).getByText(
        'Play a move for either side.',
      ),
    ).toBeTruthy();
  });

  describe('keeping the move on the board in view', () => {
    // The list's mocked ScrollView shares one scrollTo between instances.
    const scrollTo = jest.mocked(
      (ScrollView.prototype as unknown as { scrollTo: jest.Mock }).scrollTo,
    );
    const ROW = 24;

    // A list showing 100pt of 600, each move a row further down.
    async function renderLaidOut(currentId: string) {
      const props = {
        tokens: TOKENS,
        onSelect: jest.fn(),
        onLongPress: jest.fn(),
      };
      const screen = await render(
        <VariationMoveList {...props} currentId={currentId} />,
      );
      const list = screen.getByTestId('variation-move-list');
      await fireEvent(list, 'layout', {
        nativeEvent: { layout: { height: 100 } },
      });
      await fireEvent(list, 'contentSizeChange', 300, 600);
      for (const [index, id] of ['1', '2', '4', '3'].entries()) {
        await fireEvent(screen.getByTestId(`analysis-move-${id}`), 'layout', {
          nativeEvent: { layout: { y: index * 100, height: ROW } },
        });
      }
      scrollTo.mockClear();
      const goTo = (id: string) =>
        screen.rerender(<VariationMoveList {...props} currentId={id} />);
      return { list, goTo };
    }

    it('scrolls down just far enough to show a move stepped to', async () => {
      const { goTo } = await renderLaidOut('1');

      await goTo('4');

      // The move's bottom (200 + 12 padding + its row), a row below it in
      // view.
      expect(scrollTo).toHaveBeenCalledWith({
        y: 212 + ROW + 24 - 100,
        animated: true,
      });
    });

    it('scrolls back up to a move above what shows', async () => {
      const { list, goTo } = await renderLaidOut('3');
      await fireEvent(list, 'scroll', {
        nativeEvent: { contentOffset: { y: 300 } },
      });

      await goTo('2');

      expect(scrollTo).toHaveBeenCalledWith({ y: 112 - 24, animated: true });
    });

    it("stays put for a move that's already in view", async () => {
      const { list, goTo } = await renderLaidOut('1');
      // Showing 80-180: the second move, at 112, with a row around it.
      await fireEvent(list, 'scroll', {
        nativeEvent: { contentOffset: { y: 80 } },
      });

      await goTo('2');

      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});

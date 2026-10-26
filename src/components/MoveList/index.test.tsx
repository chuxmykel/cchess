import { fireEvent, render } from '@testing-library/react-native';

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
});

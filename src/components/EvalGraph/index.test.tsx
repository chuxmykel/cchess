import { fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import EvalGraph from '.';
import { buildReview } from '../../domain/review/buildReview';

const at = (cp: number, pv: string[]) => ({
  score: { kind: 'cp' as const, cp },
  pv,
  second: null,
  depth: 14,
});

// 1. e4 e5 2. Ba6?? bxa6
const REVIEW = buildReview(
  DEFAULT_POSITION,
  ['e2e4', 'e7e5', 'f1a6', 'b7a6'].map((uci) => ({ uci })),
  [
    at(20, ['e2e4']),
    at(30, ['e7e5']),
    at(30, ['g1f3']),
    at(-300, ['b7a6']),
    at(-300, ['g1f3']),
  ],
);

async function renderGraph(index = -1) {
  const onSelect = jest.fn();
  const screen = await render(
    <EvalGraph
      scores={REVIEW.scores}
      moves={REVIEW.moves}
      index={index}
      onSelect={onSelect}
    />,
  );
  await fireEvent(screen.getByTestId('eval-graph'), 'layout', {
    nativeEvent: { layout: { width: 400, height: 72 } },
  });
  return { screen, onSelect };
}

describe('EvalGraph', () => {
  it('marks the blunder with a dot, and the move shown with a line', async () => {
    const { screen } = await renderGraph(2);

    expect(screen.getByTestId('eval-graph-dot-2')).toBeTruthy();
    expect(screen.queryByTestId('eval-graph-dot-0')).toBeNull();
    // Four steps across 400: the third move is three steps in.
    expect(screen.getByTestId('eval-graph-cursor').props).toMatchObject({
      x1: 300,
      x2: 300,
    });
  });

  it('picks the move nearest a touch, and follows the finger', async () => {
    const { screen, onSelect } = await renderGraph();
    const graph = screen.getByTestId('eval-graph');

    await fireEvent(graph, 'responderGrant', {
      nativeEvent: { locationX: 210 },
    });
    expect(onSelect).toHaveBeenLastCalledWith(1);

    await fireEvent(graph, 'responderMove', {
      nativeEvent: { locationX: 0 },
    });
    expect(onSelect).toHaveBeenLastCalledWith(-1);
  });
});

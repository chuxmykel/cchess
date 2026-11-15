import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { buildReview } from '../../domain/review/buildReview';
import type { PositionEval } from '../../domain/review/types';
import { RetryJudge, useReviewStepper } from '../useReviewStepper';

const at = (cp: number, pv: string[]): PositionEval => ({
  score: { kind: 'cp', cp },
  pv,
  second: null,
  depth: 14,
});

// 1. e4 e5 2. Ba6?? bxa6 3. Nf3 - white's one key moment the blunder, after
// the book's last move.
const REVIEW = buildReview(
  DEFAULT_POSITION,
  ['e2e4', 'e7e5', 'f1a6', 'b7a6', 'g1f3'].map((uci) => ({ uci })),
  [
    at(20, ['e2e4']),
    at(30, ['e7e5']),
    at(30, ['g1f3', 'b8c6']),
    at(-300, ['b7a6', 'g1f3']),
    at(-300, ['g1f3', 'd7d6']),
    at(-300, ['d7d6']),
  ],
);

async function renderStepper(judge: RetryJudge = jest.fn()) {
  return renderHook(() => useReviewStepper(REVIEW, 'w', judge));
}

describe('useReviewStepper', () => {
  it('starts on the summary, then goes to the first key moment', async () => {
    const { result } = await renderStepper();
    expect(result.current.phase).toBe('summary');

    await act(async () => result.current.start());

    expect(result.current.phase).toBe('stepping');
    expect(result.current.moments).toEqual([1, 2]);
    expect(result.current.move?.san).toBe('e5');
  });

  it('steps from key moment to key moment, then to the close', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());

    await act(async () => result.current.next());
    expect(result.current.move?.san).toBe('Ba6');

    await act(async () => result.current.next());
    expect(result.current.phase).toBe('done');
    expect(result.current.move?.san).toBe('Nf3');
  });

  it('returns to where it was after stepping away', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());
    await act(async () => result.current.forward());
    await act(async () => result.current.forward());

    expect(result.current.move?.san).toBe('bxa6');
    expect(result.current.isOffPath).toBe(true);

    await act(async () => result.current.next());
    expect(result.current.move?.san).toBe('e5');
    expect(result.current.isOffPath).toBe(false);
  });

  it('steps back as far as the start, and no further', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(0));
    await act(async () => result.current.back());
    await act(async () => result.current.back());

    expect(result.current.index).toBe(-1);
    expect(result.current.move).toBeNull();
  });

  it('shows the best move in place of the one played, and back', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(2));
    await act(async () => result.current.toggleBest());

    expect(result.current.mode).toMatchObject({
      kind: 'best',
      best: { san: 'Nf3' },
    });

    await act(async () => result.current.toggleBest());
    expect(result.current.mode).toEqual({ kind: 'move' });
  });

  it('takes the best move tried at once, and refuses the one played', async () => {
    const judge = jest.fn();
    const { result } = await renderStepper(judge);
    await act(async () => result.current.goTo(2));
    await act(async () => result.current.retry());

    await act(async () => result.current.tryMove('f1', 'a6'));
    expect(result.current.mode).toMatchObject({
      kind: 'retry',
      tried: { san: 'Ba6', verdict: 'wrong' },
    });

    await act(async () => result.current.tryMove('g1', 'f3'));
    expect(result.current.mode).toMatchObject({
      kind: 'retry',
      tried: { san: 'Nf3', verdict: 'right' },
    });
    expect(judge).not.toHaveBeenCalled();
  });

  it('asks the engine about any other move tried', async () => {
    let answer: (good: boolean) => void = () => {};
    const judge = jest.fn(
      () => new Promise<boolean>((resolve) => (answer = resolve)),
    );
    const { result } = await renderStepper(judge);
    await act(async () => result.current.goTo(2));
    await act(async () => result.current.retry());

    await act(async () => result.current.tryMove('b1', 'c3'));
    expect(result.current.mode).toMatchObject({
      tried: { san: 'Nc3', verdict: 'checking' },
    });

    await act(async () => answer(true));
    expect(result.current.mode).toMatchObject({
      tried: { san: 'Nc3', verdict: 'right' },
    });
  });

  it('shows the engine line when asked', async () => {
    const { result } = await renderStepper();
    expect(result.current.showLine).toBe(false);
    await act(async () => result.current.toggleLine());
    expect(result.current.showLine).toBe(true);
  });
});

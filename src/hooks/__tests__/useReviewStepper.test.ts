import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { buildReview } from '../../domain/review/buildReview';
import type { PositionEval } from '../../domain/review/types';
import {
  REVIEW_LINE_STEP_MS,
  REVIEW_PLAY_STEP_MS,
} from '../../constants/review';
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

// Lets the moves play on, a step at a time.
async function play(steps: number) {
  for (let i = 0; i < steps; i++) {
    await act(async () => jest.advanceTimersByTime(REVIEW_PLAY_STEP_MS));
  }
}

describe('useReviewStepper', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts on the summary, then plays every move to the first key moment', async () => {
    const { result } = await renderStepper();
    expect(result.current.phase).toBe('summary');

    await act(async () => result.current.start());
    expect(result.current.phase).toBe('stepping');
    expect(result.current.moments).toEqual([1, 2]);
    expect(result.current.index).toBe(-1);
    expect(result.current.isPlaying).toBe(true);

    await play(1);
    expect(result.current.move?.san).toBe('e4');
    await play(1);
    expect(result.current.move?.san).toBe('e5');
    expect(result.current.isPlaying).toBe(false);

    // Stopped there.
    await play(3);
    expect(result.current.move?.san).toBe('e5');
  });

  it('plays on from key moment to key moment, then to the close', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());
    await play(2);

    await act(async () => result.current.next());
    await play(1);
    expect(result.current.move?.san).toBe('Ba6');
    expect(result.current.isPlaying).toBe(false);

    // The moves after the last moment are played too, then the close.
    await act(async () => result.current.next());
    await play(1);
    expect(result.current.move?.san).toBe('bxa6');
    expect(result.current.phase).toBe('stepping');
    await play(1);
    expect(result.current.move?.san).toBe('Nf3');
    expect(result.current.phase).toBe('stepping');

    // Then the closing cards, one at a time, after the last move.
    await play(1);
    expect(result.current.phase).toBe('done');
    expect(result.current.card?.theme).toBe('opening');
    expect(result.current.move).toBeNull();
    await act(async () => result.current.next());
    expect(result.current.card?.theme).toBe('tactics');
  });

  it('goes straight to the key moment when Next is tapped as it plays', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());

    await act(async () => result.current.next());

    expect(result.current.move?.san).toBe('e5');
    expect(result.current.isPlaying).toBe(false);
  });

  it('stops playing when stepped by hand', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());
    await play(1);

    await act(async () => result.current.back());
    await play(3);

    expect(result.current.index).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('plays on from wherever it was stepped to', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.start());
    await play(2);
    // On past the blunder, then back to before it.
    await act(async () => result.current.goTo(3));
    await act(async () => result.current.goTo(0));

    // Next plays on from e4, as if the review had come that way: to e5.
    await act(async () => result.current.next());
    await play(1);
    expect(result.current.move?.san).toBe('e5');
    await act(async () => result.current.next());
    await play(1);
    expect(result.current.move?.san).toBe('Ba6');
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

  it('plays out the line from a move, and puts the board back on Hide', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(2));
    expect(result.current.lineStep).toBeNull();
    expect(result.current.line).toEqual({
      fen: REVIEW.moves[2].fenAfter,
      moves: ['b7a6', 'g1f3'],
    });

    await act(async () => result.current.toggleLine());
    expect(result.current.lineStep).toBe(1);
    await act(async () => jest.advanceTimersByTime(REVIEW_LINE_STEP_MS));
    expect(result.current.lineStep).toBe(2);
    // The end of the line: it stays there.
    await act(async () => jest.advanceTimersByTime(REVIEW_LINE_STEP_MS * 3));
    expect(result.current.lineStep).toBe(2);

    await act(async () => result.current.toggleLine());
    expect(result.current.lineStep).toBeNull();
  });

  it('plays the line on from the best move, once shown', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(2));
    await act(async () => result.current.toggleBest());
    expect(result.current.line?.moves).toEqual(['b8c6']);
  });

  it('hides the line on another move', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(2));
    await act(async () => result.current.toggleLine());
    await act(async () => result.current.forward());
    expect(result.current.lineStep).toBeNull();
  });

  it('goes back to the moves from the close, and plays on from there', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(5));
    expect(result.current.phase).toBe('done');

    await act(async () => result.current.goTo(2));
    expect(result.current.phase).toBe('stepping');
    expect(result.current.move?.san).toBe('Ba6');

    // On through the last moves, then the first card again.
    await act(async () => result.current.next());
    await play(3);
    expect(result.current.card?.theme).toBe('opening');
  });

  it('goes no further than the last card', async () => {
    const { result } = await renderStepper();
    await act(async () => result.current.goTo(99));
    expect(result.current.card?.theme).toBe('tactics');
    await act(async () => result.current.next());
    expect(result.current.card?.theme).toBe('tactics');
  });
});

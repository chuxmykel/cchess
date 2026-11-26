import { act, renderHook } from '@testing-library/react-native';

import {
  PUZZLE_REPLY_MS,
  PUZZLE_SETUP_MS,
  PUZZLE_SOLUTION_STEP_MS,
} from '../../constants/puzzles';
import { fromMine, fromPool } from '../../domain/puzzles/puzzle';
import { usePuzzleSolver } from '../usePuzzleSolver';

// Black plays a7a6, then Rd1-d8 mates.
const MATE = fromPool({
  id: 'p1',
  fen: '6k1/p4ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
  moves: ['a7a6', 'd1d8'],
  rating: 1500,
  themes: ['mateIn1'],
});

// White to move, a line of three: Nf3 Nc6 Bb5.
const LINE = fromMine({
  id: 'm1',
  fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  solution: ['g1f3', 'b8c6', 'f1b5'],
  themes: [],
});

async function solving(puzzle = MATE) {
  const onResult = jest.fn();
  const hook = await renderHook(() => usePuzzleSolver(puzzle, onResult));
  return { ...hook, onResult };
}

const wait = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

describe('usePuzzleSolver', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("plays the opponent's setting move, then takes the solution as solved", async () => {
    const { result, onResult } = await solving();
    expect(result.current.status).toBe('setting');

    await wait(PUZZLE_SETUP_MS);
    expect(result.current).toMatchObject({
      status: 'playing',
      solver: 'w',
      lastMove: { from: 'a7', to: 'a6' },
    });

    await act(async () => result.current.tryMove('d1', 'd8'));
    expect(result.current.status).toBe('solved');
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('misses on a wrong move, saying which, and reports it once', async () => {
    const { result, onResult } = await solving();
    await wait(PUZZLE_SETUP_MS);

    await act(async () => result.current.tryMove('d1', 'd7'));
    expect(result.current).toMatchObject({
      status: 'failed',
      wrongMove: 'Rd7',
    });
    expect(onResult).toHaveBeenCalledWith(false);

    // Tried again and solved: still the one result.
    await act(async () => result.current.retry());
    await wait(PUZZLE_SETUP_MS);
    await act(async () => result.current.tryMove('d1', 'd8'));
    expect(result.current.status).toBe('solved');
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("answers each right move with the line's reply, to the end", async () => {
    const { result, onResult } = await solving(LINE);
    expect(result.current.status).toBe('playing');

    await act(async () => result.current.tryMove('g1', 'f3'));
    expect(result.current.status).toBe('playing');
    await wait(PUZZLE_REPLY_MS);
    expect(result.current.lastMove).toEqual({ from: 'b8', to: 'c6' });

    await act(async () => result.current.tryMove('f1', 'b5'));
    expect(result.current.status).toBe('solved');
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('shows the solution, a move at a time, counting as a miss', async () => {
    const { result, onResult } = await solving(LINE);

    await act(async () => result.current.showSolution());
    expect(onResult).toHaveBeenCalledWith(false);
    for (let i = 0; i < 3; i++) await wait(PUZZLE_SOLUTION_STEP_MS);

    expect(result.current.lastMove).toEqual({ from: 'f1', to: 'b5' });
    expect(result.current.status).toBe('failed');
  });

  it('hints at the next move only, counting the puzzle as missed', async () => {
    const { result, onResult } = await solving(LINE);
    expect(result.current.canHint).toBe(true);

    await act(async () => result.current.showHint());
    expect(result.current.hint).toEqual({ from: 'g1', to: 'f3' });
    expect(result.current.hinted).toBe(true);
    expect(onResult).toHaveBeenCalledWith(false);

    // Played, the hint goes; none while the reply's on its way.
    await act(async () => result.current.tryMove('g1', 'f3'));
    expect(result.current.hint).toBeNull();
    expect(result.current.canHint).toBe(false);
    await wait(PUZZLE_REPLY_MS);
    expect(result.current.canHint).toBe(true);

    // The next hint is the next move, not the line.
    await act(async () => result.current.showHint());
    expect(result.current.hint).toEqual({ from: 'f1', to: 'b5' });
    await act(async () => result.current.tryMove('f1', 'b5'));
    expect(result.current).toMatchObject({ status: 'solved', hinted: true });
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('steps back and forward through the moves played, playing only at the latest', async () => {
    const { result } = await solving();
    await wait(PUZZLE_SETUP_MS);
    expect(result.current.steps).toMatchObject({
      canGoBack: true,
      canGoForward: false,
    });

    await act(async () => result.current.steps.back());
    expect(result.current).toMatchObject({
      fen: MATE.fen,
      lastMove: null,
      isLive: false,
    });
    expect(result.current.steps.canGoBack).toBe(false);
    // Not played while an earlier position's shown.
    await act(async () => result.current.tryMove('d1', 'd8'));
    expect(result.current.status).toBe('playing');

    await act(async () => result.current.steps.forward());
    expect(result.current).toMatchObject({
      isLive: true,
      lastMove: { from: 'a7', to: 'a6' },
    });
    await act(async () => result.current.tryMove('d1', 'd8'));
    expect(result.current.status).toBe('solved');
  });
});

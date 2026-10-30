import { act, renderHook } from '@testing-library/react-native';

import { useGameClock } from '../useGameClock';

const INITIAL_WHITE_MS = 300000; // 5:00
const INITIAL_BLACK_MS = 280000; // 4:40

const ONE_SECOND_MS = 1000;
const TWO_SECONDS_MS = 2000;
const FIVE_SECONDS_MS = 5000;

const ALMOST_FLAGGED_WHITE_MS = 500;

describe('useGameClock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at the authoritative values with nothing elapsed', async () => {
    const { result } = await renderHook(() =>
      useGameClock(INITIAL_WHITE_MS, INITIAL_BLACK_MS, 'w', true),
    );

    expect(result.current).toEqual({
      whiteMs: INITIAL_WHITE_MS,
      blackMs: INITIAL_BLACK_MS,
    });
  });

  it("ticks down the side to move's clock while active", async () => {
    const { result } = await renderHook(() =>
      useGameClock(INITIAL_WHITE_MS, INITIAL_BLACK_MS, 'w', true),
    );

    await act(() => {
      jest.advanceTimersByTime(TWO_SECONDS_MS);
    });

    expect(result.current.whiteMs).toBe(INITIAL_WHITE_MS - TWO_SECONDS_MS);
    expect(result.current.blackMs).toBe(INITIAL_BLACK_MS);
  });

  it('does not tick while inactive', async () => {
    const { result } = await renderHook(() =>
      useGameClock(INITIAL_WHITE_MS, INITIAL_BLACK_MS, 'w', false),
    );

    await act(() => {
      jest.advanceTimersByTime(FIVE_SECONDS_MS);
    });

    expect(result.current.whiteMs).toBe(INITIAL_WHITE_MS);
  });

  it('re-anchors to new authoritative values and drops locally-elapsed time when they change', async () => {
    const whiteMSAfterMove = 299000;
    const { result, rerender } = await renderHook(
      (props: { whiteMs: number; blackMs: number; turn: 'w' | 'b' }) =>
        useGameClock(props.whiteMs, props.blackMs, props.turn, true),
      {
        initialProps: {
          whiteMs: INITIAL_WHITE_MS,
          blackMs: INITIAL_BLACK_MS,
          turn: 'w',
        },
      },
    );

    await act(() => {
      jest.advanceTimersByTime(TWO_SECONDS_MS);
    });
    expect(result.current.whiteMs).toBe(INITIAL_WHITE_MS - TWO_SECONDS_MS);

    await act(() => {
      rerender({
        whiteMs: whiteMSAfterMove,
        blackMs: INITIAL_BLACK_MS,
        turn: 'b',
      });
    });

    // Fresh server clock from the move that just landed - no stale elapsed
    // time carried over, and the side to move switched to black.
    expect(result.current).toEqual({
      whiteMs: whiteMSAfterMove,
      blackMs: INITIAL_BLACK_MS,
    });

    await act(() => {
      jest.advanceTimersByTime(ONE_SECOND_MS);
    });
    expect(result.current).toEqual({
      whiteMs: whiteMSAfterMove,
      blackMs: INITIAL_BLACK_MS - ONE_SECOND_MS,
    });
  });

  it('catches up on time no tick saw, as after the app was in the background', async () => {
    const { result } = await renderHook(() =>
      useGameClock(INITIAL_WHITE_MS, INITIAL_BLACK_MS, 'w', true),
    );

    // The timers stop while the app is away, but the time still passes.
    jest.setSystemTime(Date.now() + FIVE_SECONDS_MS);
    await act(() => {
      jest.advanceTimersByTime(ONE_SECOND_MS);
    });

    expect(result.current.whiteMs).toBe(
      INITIAL_WHITE_MS - FIVE_SECONDS_MS - ONE_SECOND_MS,
    );
  });

  it('never ticks below zero', async () => {
    const { result } = await renderHook(() =>
      useGameClock(ALMOST_FLAGGED_WHITE_MS, INITIAL_BLACK_MS, 'w', true),
    );

    await act(() => {
      jest.advanceTimersByTime(TWO_SECONDS_MS);
    });

    expect(result.current.whiteMs).toBe(0);
  });
});

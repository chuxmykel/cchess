import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import {
  SETTLE_MS,
  UPDATE_INTERVAL_MS,
  useEngineAnalysis,
} from '../useEngineAnalysis';
import { makeFakeEngine } from '../../testUtils/fakeEngine';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const OPTIONS = { enabled: true, multiPv: 2, limit: { depth: 18 } };

describe('useEngineAnalysis', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function settle(ms = SETTLE_MS) {
    await act(async () => jest.advanceTimersByTime(ms));
  }

  it('is off with no engine, or when not wanted', async () => {
    const engine = makeFakeEngine();
    const none = await renderHook(() =>
      useEngineAnalysis(null, DEFAULT_POSITION, OPTIONS),
    );
    const unwanted = await renderHook(() =>
      useEngineAnalysis(engine, DEFAULT_POSITION, {
        ...OPTIONS,
        enabled: false,
      }),
    );
    await settle();

    expect(none.result.current.status).toBe('off');
    expect(unwanted.result.current.status).toBe('off');
    expect(engine.analyse).not.toHaveBeenCalled();
  });

  it('analyses a position once it has been on it a moment', async () => {
    const engine = makeFakeEngine();
    const { result } = await renderHook(() =>
      useEngineAnalysis(engine, DEFAULT_POSITION, OPTIONS),
    );
    expect(engine.analyse).not.toHaveBeenCalled();

    await settle();

    expect(engine.requests).toEqual([
      {
        fen: DEFAULT_POSITION,
        multiPv: 2,
        limit: { depth: 18, movetimeMs: undefined, infinite: undefined },
      },
    ]);
    expect(result.current).toEqual({
      status: 'thinking',
      depth: 0,
      lines: [],
      stale: false,
    });
  });

  it('shows its lines as SAN with their scores, a few times a second', async () => {
    const engine = makeFakeEngine();
    const { result } = await renderHook(() =>
      useEngineAnalysis(engine, DEFAULT_POSITION, OPTIONS),
    );
    await settle();

    await act(async () =>
      engine.report({
        depth: 12,
        lines: [
          { multipv: 1, score: { kind: 'cp', cp: 34 }, pv: ['e2e4', 'e7e5'] },
        ],
      }),
    );
    expect(result.current.depth).toBe(0);
    await settle(UPDATE_INTERVAL_MS);

    expect(result.current).toEqual({
      status: 'thinking',
      depth: 12,
      lines: [
        {
          score: { kind: 'cp', cp: 34 },
          formatted: '+0.3',
          sans: ['e4', 'e5'],
          moves: [
            { label: '1.', san: 'e4' },
            { label: null, san: 'e5' },
          ],
          pv: ['e2e4', 'e7e5'],
        },
      ],
      stale: false,
    });
  });

  it('shows the finished search at once', async () => {
    const engine = makeFakeEngine();
    const { result } = await renderHook(() =>
      useEngineAnalysis(engine, DEFAULT_POSITION, OPTIONS),
    );
    await settle();

    await act(async () => engine.report({ depth: 18, done: true }));

    expect(result.current.status).toBe('done');
    expect(result.current.depth).toBe(18);
  });

  it("stops the last search for a new position, keeping its lines - marked stale - until this one's come", async () => {
    const engine = makeFakeEngine();
    const { result, rerender } = await renderHook(
      ({ fen }: { fen: string }) => useEngineAnalysis(engine, fen, OPTIONS),
      { initialProps: { fen: DEFAULT_POSITION } },
    );
    await settle();
    await act(async () =>
      engine.report({
        depth: 18,
        done: true,
        lines: [
          { multipv: 1, score: { kind: 'cp', cp: 34 }, pv: ['e2e4', 'e7e5'] },
        ],
      }),
    );

    await rerender({ fen: AFTER_E4 });

    expect(engine.stopped).toBe(1);
    expect(result.current).toMatchObject({ status: 'thinking', stale: true });
    expect(result.current.lines[0].sans).toEqual(['e4', 'e5']);

    await settle();
    await act(async () =>
      engine.report({
        depth: 18,
        done: true,
        lines: [{ multipv: 1, score: { kind: 'cp', cp: 30 }, pv: ['e7e5'] }],
      }),
    );
    expect(result.current).toMatchObject({ status: 'done', stale: false });
    expect(result.current.lines[0].sans).toEqual(['e5']);
  });

  it("doesn't start a search on each position stepped through quickly", async () => {
    const engine = makeFakeEngine();
    const { rerender } = await renderHook(
      ({ fen }: { fen: string }) => useEngineAnalysis(engine, fen, OPTIONS),
      { initialProps: { fen: DEFAULT_POSITION } },
    );

    await rerender({ fen: AFTER_E4 });
    await settle();

    expect(engine.requests.map((request) => request.fen)).toEqual([AFTER_E4]);
  });
});

import { DEFAULT_POSITION } from 'chess.js';

import type { PositionEval } from '../../domain/review/types';
import { makeFakeEngine } from '../../testUtils/fakeEngine';
import { analyseOnce, runReview } from '../reviewRunner';
import { EngineUpdate } from '../types';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const AFTER_E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const MATED = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
const search = { multiPv: 2, limit: { depth: 14, movetimeMs: 1500 } };

const line = (cp: number, pv: string[], multipv = 1) => ({
  multipv,
  score: { kind: 'cp' as const, cp },
  pv,
});

// Lets the runner's awaited searches move on.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('analyseOnce', () => {
  it('resolves with the last update once the search is done', async () => {
    const engine = makeFakeEngine();
    const result = analyseOnce(engine, { fen: DEFAULT_POSITION, ...search });
    engine.report({ depth: 10, lines: [line(20, ['e2e4'])] });
    engine.report({ depth: 14, lines: [line(25, ['d2d4'])] });
    engine.report({ depth: 14, done: true, lines: [] });

    const update = (await result) as EngineUpdate;
    expect(update.depth).toBe(14);
    expect(update.lines[0].pv).toEqual(['d2d4']);
  });

  it('stops the search and resolves with nothing when aborted', async () => {
    const engine = makeFakeEngine();
    const controller = new AbortController();
    const result = analyseOnce(
      engine,
      { fen: DEFAULT_POSITION, ...search },
      controller.signal,
    );
    controller.abort();

    expect(await result).toBeNull();
    expect(engine.stopped).toBe(1);
  });
});

describe('runReview', () => {
  it('shares the positions between the engines, one search each at a time', async () => {
    const main = makeFakeEngine();
    const threat = makeFakeEngine();
    const evals: Record<number, PositionEval> = {};
    const done = runReview({
      engines: [main, threat],
      fens: [DEFAULT_POSITION, AFTER_E4, AFTER_E5],
      known: [],
      search,
      onEval: (index, positionEval) => (evals[index] = positionEval),
    });

    expect(main.requests.map((r) => r.fen)).toEqual([DEFAULT_POSITION]);
    expect(threat.requests.map((r) => r.fen)).toEqual([AFTER_E4]);
    expect(main.requests[0]).toMatchObject(search);

    threat.report({
      depth: 14,
      done: true,
      lines: [line(30, ['e7e5', 'g1f3']), line(40, ['c7c5'], 2)],
    });
    await flush();
    expect(threat.requests.map((r) => r.fen)).toEqual([AFTER_E4, AFTER_E5]);
    expect(evals[1]).toEqual({
      score: { kind: 'cp', cp: 30 },
      pv: ['e7e5', 'g1f3'],
      second: { kind: 'cp', cp: 40 },
      depth: 14,
    });

    main.report({ depth: 14, done: true, lines: [line(20, ['e2e4'])] });
    threat.report({ depth: 14, done: true, lines: [line(30, ['g1f3'])] });
    await done;
    expect(Object.keys(evals)).toEqual(['0', '1', '2']);
    expect(evals[0].second).toBeNull();
  });

  it('skips positions already analysed', async () => {
    const engine = makeFakeEngine();
    const known = {
      score: { kind: 'cp' as const, cp: 0 },
      pv: [],
      second: null,
      depth: 14,
    };
    const done = runReview({
      engines: [engine],
      fens: [DEFAULT_POSITION, AFTER_E4],
      known: [known],
      search,
      onEval: jest.fn(),
    });

    expect(engine.requests.map((r) => r.fen)).toEqual([AFTER_E4]);
    engine.report({ done: true, lines: [line(0, ['e7e5'])] });
    await done;
  });

  it('needs no search for a position with no moves left', async () => {
    const engine = makeFakeEngine();
    const onEval = jest.fn();
    await runReview({
      engines: [engine],
      fens: [MATED],
      known: [],
      search,
      onEval,
    });

    expect(engine.requests).toHaveLength(0);
    expect(onEval).toHaveBeenCalledWith(0, {
      score: { kind: 'mate', moves: 0, winner: 'b' },
      pv: [],
      second: null,
      depth: 0,
    });
  });

  it('stops when aborted, leaving the rest unanalysed', async () => {
    const engine = makeFakeEngine();
    const controller = new AbortController();
    const onEval = jest.fn();
    const done = runReview({
      engines: [engine],
      fens: [DEFAULT_POSITION, AFTER_E4],
      known: [],
      search,
      onEval,
      signal: controller.signal,
    });
    controller.abort();
    await done;

    expect(onEval).not.toHaveBeenCalled();
    expect(engine.requests).toHaveLength(1);
  });
});

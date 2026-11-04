import { DEFAULT_POSITION } from 'chess.js';

import { makeFakeUciTransport } from '../../testUtils/fakeUciTransport';
import { UciEngine } from '../UciEngine';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

// An engine through its handshake, ready to search.
function readyEngine() {
  const transport = makeFakeUciTransport();
  const engine = new UciEngine(transport);
  transport.print('uciok', 'readyok');
  transport.sent.length = 0;
  return { transport, engine };
}

describe('UciEngine', () => {
  it('says hello, sets its hash, and waits until ready', () => {
    const transport = makeFakeUciTransport();
    new UciEngine(transport, 32);

    expect(transport.sent).toEqual(['uci']);
    transport.print('uciok');
    expect(transport.sent).toEqual([
      'uci',
      'setoption name Hash value 32',
      'isready',
    ]);
  });

  it('holds a request made before it is ready, then runs it', () => {
    const transport = makeFakeUciTransport();
    const engine = new UciEngine(transport);
    engine.analyse(
      { fen: DEFAULT_POSITION, multiPv: 2, limit: { depth: 18 } },
      jest.fn(),
    );

    expect(transport.sent).not.toContain('go depth 18');
    transport.print('uciok', 'readyok');
    expect(transport.sent.slice(-3)).toEqual([
      'setoption name MultiPV value 2',
      `position fen ${DEFAULT_POSITION}`,
      'go depth 18',
    ]);
  });

  it('searches for a set time when asked to', () => {
    const { transport, engine } = readyEngine();
    engine.analyse(
      { fen: DEFAULT_POSITION, multiPv: 1, limit: { movetimeMs: 500 } },
      jest.fn(),
    );

    expect(transport.sent).toContain('go movetime 500');
  });

  it('searches on until stopped when asked to', () => {
    const { transport, engine } = readyEngine();
    engine.analyse(
      { fen: DEFAULT_POSITION, multiPv: 1, limit: { infinite: true } },
      jest.fn(),
    );

    expect(transport.sent).toContain('go infinite');
  });

  it("reports each line, best first, scored from white's side", () => {
    const { transport, engine } = readyEngine();
    const onUpdate = jest.fn();
    engine.analyse(
      { fen: AFTER_E4, multiPv: 2, limit: { depth: 10 } },
      onUpdate,
    );

    transport.print(
      'info depth 10 multipv 2 score cp 40 pv e7e6 d2d4',
      'info depth 10 multipv 1 score cp 20 pv c7c5 g1f3',
    );

    expect(onUpdate).toHaveBeenLastCalledWith({
      fen: AFTER_E4,
      depth: 10,
      done: false,
      lines: [
        { multipv: 1, score: { kind: 'cp', cp: -20 }, pv: ['c7c5', 'g1f3'] },
        { multipv: 2, score: { kind: 'cp', cp: -40 }, pv: ['e7e6', 'd2d4'] },
      ],
    });
  });

  it('leaves out a score the search has only bounded', () => {
    const { transport, engine } = readyEngine();
    const onUpdate = jest.fn();
    engine.analyse({ fen: DEFAULT_POSITION, multiPv: 1, limit: {} }, onUpdate);

    transport.print('info depth 12 score cp 30 lowerbound pv e2e4');

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('says when the search is done', () => {
    const { transport, engine } = readyEngine();
    const onUpdate = jest.fn();
    engine.analyse({ fen: DEFAULT_POSITION, multiPv: 1, limit: {} }, onUpdate);

    transport.print('info depth 5 score cp 30 pv e2e4', 'bestmove e2e4');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ done: true, depth: 5 }),
    );
  });

  describe('given a new position mid-search', () => {
    it('stops the search, and starts the new one only once it has', () => {
      const { transport, engine } = readyEngine();
      const first = jest.fn();
      const second = jest.fn();
      engine.analyse({ fen: DEFAULT_POSITION, multiPv: 1, limit: {} }, first);
      transport.sent.length = 0;

      engine.analyse({ fen: AFTER_E4, multiPv: 1, limit: {} }, second);
      expect(transport.sent).toEqual(['stop']);

      // The old search's last words are nobody's.
      transport.print('info depth 9 score cp 31 pv e2e4');
      expect(first).not.toHaveBeenCalled();
      expect(second).not.toHaveBeenCalled();

      transport.print('bestmove e2e4');
      expect(transport.sent).toContain(`position fen ${AFTER_E4}`);
      transport.print('info depth 3 score cp -25 pv c7c5');
      expect(second).toHaveBeenCalledWith(
        expect.objectContaining({ fen: AFTER_E4 }),
      );
    });

    it('runs only the latest of several asked for while stopping', () => {
      const { transport, engine } = readyEngine();
      engine.analyse(
        { fen: DEFAULT_POSITION, multiPv: 1, limit: {} },
        jest.fn(),
      );
      engine.analyse({ fen: AFTER_E4, multiPv: 1, limit: {} }, jest.fn());
      const latest =
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
      engine.analyse({ fen: latest, multiPv: 1, limit: {} }, jest.fn());
      transport.sent.length = 0;

      transport.print('bestmove e2e4');

      expect(transport.sent).toEqual([
        'setoption name MultiPV value 1',
        `position fen ${latest}`,
        'go depth 18',
      ]);
    });
  });

  it('stops a search that is called off, reporting nothing more of it', () => {
    const { transport, engine } = readyEngine();
    const onUpdate = jest.fn();
    const stop = engine.analyse(
      { fen: DEFAULT_POSITION, multiPv: 1, limit: {} },
      onUpdate,
    );

    stop();
    transport.print('info depth 9 score cp 31 pv e2e4', 'bestmove e2e4');

    expect(transport.sent).toContain('stop');
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

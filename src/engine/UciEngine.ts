import { Color } from 'chess.js';

import { toWhitePov } from '../domain/evalScore';
import { parseUciLine } from '../domain/uci';
import {
  AnalysisEngine,
  AnalysisRequest,
  EngineLine,
  EngineUpdate,
  UciTransport,
} from './types';

type Search = {
  request: AnalysisRequest;
  onUpdate: (update: EngineUpdate) => void;
  lines: Map<number, EngineLine>;
  depth: number;
};

// Analysis over UCI. One search at a time: a new request stops the one
// running and waits for its `bestmove` - the engine's word that it has
// stopped - before starting, so a line from the old position is never shown
// as the new one's. Requests that come in the meantime replace each other;
// only the latest runs.
export class UciEngine implements AnalysisEngine {
  private ready = false;
  // A search is running in the engine - ours, or one stopped and not yet
  // finished.
  private busy = false;
  private active: Search | null = null;
  private pending: Search | null = null;

  constructor(
    private readonly transport: UciTransport,
    private readonly hashMb = 16,
  ) {
    transport.onLine((line) => this.handle(line));
    transport.send('uci');
  }

  analyse(
    request: AnalysisRequest,
    onUpdate: (update: EngineUpdate) => void,
  ): () => void {
    const search: Search = { request, onUpdate, lines: new Map(), depth: 0 };
    this.pending = search;
    if (this.busy) this.stopActive();
    else this.startPending();
    return () => {
      if (this.pending === search) this.pending = null;
      if (this.active === search) this.stopActive();
    };
  }

  private stopActive() {
    // Nothing more of it is reported, even before the engine stops.
    this.active = null;
    this.transport.send('stop');
  }

  private startPending() {
    const search = this.pending;
    if (!this.ready || !search) return;
    this.pending = null;
    this.active = search;
    this.busy = true;
    const { fen, multiPv, limit } = search.request;
    this.transport.send(`setoption name MultiPV value ${multiPv}`);
    this.transport.send(`position fen ${fen}`);
    this.transport.send(
      limit.infinite
        ? 'go infinite'
        : limit.movetimeMs !== undefined
          ? `go movetime ${limit.movetimeMs}`
          : `go depth ${limit.depth ?? 18}`,
    );
  }

  private handle(line: string) {
    const message = parseUciLine(line);
    if (!message) return;
    switch (message.type) {
      case 'uciok':
        this.transport.send(`setoption name Hash value ${this.hashMb}`);
        this.transport.send('isready');
        break;
      case 'readyok':
        this.ready = true;
        this.startPending();
        break;
      case 'info': {
        const search = this.active;
        // An unsettled score - only a bound so far - isn't shown.
        if (!search || message.bound) return;
        const turn = search.request.fen.split(' ')[1] as Color;
        search.lines.set(message.multipv, {
          multipv: message.multipv,
          score: toWhitePov(message.score, turn),
          pv: message.pv,
        });
        search.depth = Math.max(search.depth, message.depth);
        this.report(search, false);
        break;
      }
      case 'bestmove': {
        const search = this.active;
        this.busy = false;
        this.active = null;
        if (search) this.report(search, true);
        this.startPending();
        break;
      }
    }
  }

  private report(search: Search, done: boolean) {
    search.onUpdate({
      fen: search.request.fen,
      depth: search.depth,
      lines: [...search.lines.values()]
        .filter((line) => line.multipv <= search.request.multiPv)
        .sort((a, b) => a.multipv - b.multipv),
      done,
    });
  }
}

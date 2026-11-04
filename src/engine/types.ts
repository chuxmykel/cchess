import { EngineScore } from '../domain/evalScore';

// What analysis asks of an engine - the Stockfish in a WebView today, but
// anything that can analyse a position could stand in (see UciEngine).

export type SearchLimit = {
  depth?: number;
  movetimeMs?: number;
  infinite?: boolean;
};

export type AnalysisRequest = {
  fen: string;
  // How many of the best lines to follow.
  multiPv: number;
  // When to stop: at this depth, or after this long - or never, `infinite`,
  // until it's stopped for another position.
  limit: SearchLimit;
};

export type EngineLine = {
  multipv: number;
  // From white's point of view (see toWhitePov).
  score: EngineScore;
  // The line's moves, in UCI.
  pv: string[];
};

export type EngineUpdate = {
  fen: string;
  depth: number;
  // Best first.
  lines: EngineLine[];
  // The search has finished: no more updates for this request.
  done: boolean;
};

export interface AnalysisEngine {
  // Starts analysing, in place of whatever it was analysing before, and
  // reports as the search deepens. Returns a function that stops it.
  analyse(
    request: AnalysisRequest,
    onUpdate: (update: EngineUpdate) => void,
  ): () => void;
}

// A UCI engine's text channel: commands in, its lines out.
export interface UciTransport {
  send(command: string): void;
  onLine(listener: (line: string) => void): () => void;
}

// The two searches analysis runs side by side: the position's own, and what
// the side not to move threatens.
export type EngineSlot = 'main' | 'threat';
export const ENGINE_SLOTS: readonly EngineSlot[] = ['main', 'threat'];

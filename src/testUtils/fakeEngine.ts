import { AnalysisEngine, AnalysisRequest, EngineUpdate } from '../engine/types';

// An engine a test drives: each request is kept, and `report` sends the
// latest one an update, as a search would.
export function makeFakeEngine() {
  const requests: AnalysisRequest[] = [];
  let listener: ((update: EngineUpdate) => void) | null = null;
  const engine: AnalysisEngine & {
    requests: AnalysisRequest[];
    stopped: number;
    report: (update: Partial<EngineUpdate>) => void;
  } = {
    requests,
    stopped: 0,
    analyse: jest.fn((request, onUpdate) => {
      requests.push(request);
      listener = onUpdate;
      return () => {
        engine.stopped += 1;
        if (listener === onUpdate) listener = null;
      };
    }),
    report: (update) =>
      listener?.({
        fen: requests[requests.length - 1].fen,
        depth: 1,
        lines: [],
        done: false,
        ...update,
      }),
  };
  return engine;
}

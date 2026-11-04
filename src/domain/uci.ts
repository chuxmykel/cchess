// Reading what a UCI engine prints - the part of the protocol analysis needs.

// A score as the engine gives it: from the side to move's point of view.
// `mate N` is mate in N for the side to move, `mate -N` mate against it, and
// `mate 0` that it's already mated.
export type RawScore = { kind: 'cp' | 'mate'; value: number };

export type UciInfo = {
  type: 'info';
  depth: number;
  multipv: number;
  score: RawScore;
  // A score the search hasn't settled - only a lower or upper limit so far.
  bound?: 'lower' | 'upper';
  pv: string[];
};

export type UciMessage =
  | UciInfo
  | { type: 'bestmove'; move: string | null }
  | { type: 'uciok' }
  | { type: 'readyok' };

// Null for anything analysis doesn't use - `info string`, `info currmove`,
// an `info` without a line of moves, the engine's banner.
export function parseUciLine(line: string): UciMessage | null {
  const words = line.trim().split(/\s+/);
  switch (words[0]) {
    case 'uciok':
      return { type: 'uciok' };
    case 'readyok':
      return { type: 'readyok' };
    case 'bestmove':
      return {
        type: 'bestmove',
        move: words[1] && words[1] !== '(none)' ? words[1] : null,
      };
    case 'info':
      return parseInfo(words);
    default:
      return null;
  }
}

function parseInfo(words: string[]): UciInfo | null {
  let depth: number | null = null;
  let multipv = 1;
  let score: RawScore | null = null;
  let bound: UciInfo['bound'];
  let pv: string[] = [];
  for (let i = 1; i < words.length; i++) {
    switch (words[i]) {
      case 'string':
        return null;
      case 'depth':
        depth = Number(words[++i]);
        break;
      case 'multipv':
        multipv = Number(words[++i]);
        break;
      case 'score':
        score = {
          kind: words[i + 1] === 'mate' ? 'mate' : 'cp',
          value: Number(words[i + 2]),
        };
        i += 2;
        break;
      case 'lowerbound':
        bound = 'lower';
        break;
      case 'upperbound':
        bound = 'upper';
        break;
      case 'pv':
        pv = words.slice(i + 1);
        i = words.length;
        break;
    }
  }
  if (depth === null || score === null || pv.length === 0) return null;
  return { type: 'info', depth, multipv, score, bound, pv };
}

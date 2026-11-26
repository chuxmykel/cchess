import { Chess, DEFAULT_POSITION } from 'chess.js';

import { AnalysisTree, toMoveListTokens } from './analysisTree';

const STANDARD_START = new Chess(DEFAULT_POSITION).fen();

// An analysis as a PGN: the Seven Tag Roster left unknown, as an analysis
// has no event, players or result of its own - plus `SetUp`/`FEN` when it
// starts anywhere but the starting position - and every move tried, its
// variations in brackets after the move they replace, as lichess exports
// one.
export function analysisToPgn(tree: AnalysisTree): string {
  const startFen = tree.nodes[tree.rootId].fen;
  const tags: [string, string][] = [
    ['Event', '?'],
    ['Site', '?'],
    ['Date', '????.??.??'],
    ['Round', '?'],
    ['White', '?'],
    ['Black', '?'],
    ['Result', '*'],
    ...(startFen === STANDARD_START
      ? []
      : ([
          ['SetUp', '1'],
          ['FEN', startFen],
        ] as [string, string][])),
  ];
  const header = tags.map(([name, value]) => `[${name} "${value}"]`).join('\n');
  return `${header}\n\n${moveText(tree)}`;
}

function moveText(tree: AnalysisTree): string {
  const words: string[] = [];
  let opened = false;
  for (const token of toMoveListTokens(tree)) {
    if (token.kind === 'open') {
      words.push('(');
      opened = true;
      continue;
    }
    if (token.kind === 'close') {
      words[words.length - 1] += ')';
      continue;
    }
    const move = token.label ? `${token.label} ${token.san}` : token.san;
    if (opened) words[words.length - 1] += move;
    else words.push(move);
    opened = false;
  }
  return [...words, '*'].join(' ');
}

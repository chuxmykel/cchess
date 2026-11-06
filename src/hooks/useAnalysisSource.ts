import { useCallback, useEffect, useState } from 'react';
import { Color, DEFAULT_POSITION } from 'chess.js';

import { useAuthSession } from '../context/AuthSessionContext';
import { treeFromMoves, uciOf } from '../domain/analysisTree';
import { colorPlayedBy } from '../domain/players';
import { GameSnapshot, GameUserSummary } from '../network/socketEvents';
import { getGame } from '../network/restClient';
import { AnalysisStart } from './useAnalysisTree';

// What an analysis starts from: an empty board; a position being set up
// (`fen` to start the editor from); a game played here, at `ply` moves in
// (its end, left out); or moves and a position brought in - pasted, or
// finished setting up.
export type AnalysisSource =
  | { kind: 'new' }
  | { kind: 'setup'; fen?: string }
  | { kind: 'game'; gameId: string; ply?: number }
  | { kind: 'import'; startFen: string; uciMoves: string[] };

export type AnalysisSourceState =
  | { status: 'loading' }
  | { status: 'error' }
  // Your own daily game, still being played: not for an engine.
  | { status: 'in-play' }
  // `orientation`: the side to look from - your own, in a game you played;
  // `gameStatus` and `players`, a game's, when it's one.
  | {
      status: 'ready';
      start: AnalysisStart;
      orientation: Color;
      gameStatus?: GameSnapshot['status'];
      players?: { white: GameUserSummary; black: GameUserSummary };
    };

// A game's moves, from the usual start. A game that began somewhere else -
// a server testing from GAME_START_FEN - doesn't say where, so its moves
// can't be replayed; it's analysed from where it ended instead.
export function startOfGame(
  snapshot: Pick<GameSnapshot, 'moves' | 'fen'>,
  ply?: number,
): AnalysisStart {
  const uciMoves = snapshot.moves.map((move) =>
    uciOf({
      from: move.from,
      to: move.to,
      promotion: move.promotion ?? undefined,
    }),
  );
  if (treeFromMoves(DEFAULT_POSITION, uciMoves).line.length < uciMoves.length) {
    return { startFen: snapshot.fen };
  }
  return { startFen: DEFAULT_POSITION, uciMoves, initialPly: ply };
}

// Resolves where an analysis starts. Only a game needs fetching; the rest
// are ready at once. (A position being set up has no start yet.) Your own
// daily game still being played is refused - the engine would play it for
// you - unless allowDailyInPlay, for its own analysis board, which has none.
// `skip` fetches nothing - the game's at hand already. Fetching again keeps
// what was fetched shown until the game comes, unless that failed.
export function useAnalysisSource(
  source: AnalysisSource,
  {
    allowDailyInPlay = false,
    skip = false,
  }: { allowDailyInPlay?: boolean; skip?: boolean } = {},
): {
  state: AnalysisSourceState;
  reload: () => void;
} {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const gameId = source.kind === 'game' ? source.gameId : null;
  const ply = source.kind === 'game' ? source.ply : undefined;
  const [fetched, setFetched] = useState<{
    gameId: string;
    state: AnalysisSourceState;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!gameId || skip) return;
    let current = true;
    authorized((token) => getGame(gameId, token))
      .then((snapshot) => {
        if (!current) return;
        const playedAs = userId ? colorPlayedBy(snapshot, userId) : null;
        const isMyDailyInPlay =
          snapshot.gameType === 'daily' &&
          snapshot.status === 'active' &&
          playedAs !== null;
        setFetched({
          gameId,
          state:
            isMyDailyInPlay && !allowDailyInPlay
              ? { status: 'in-play' }
              : {
                  status: 'ready',
                  start: startOfGame(snapshot, ply),
                  orientation: playedAs ?? 'w',
                  gameStatus: snapshot.status,
                  players: { white: snapshot.white, black: snapshot.black },
                },
        });
      })
      .catch(() => {
        if (current) setFetched({ gameId, state: { status: 'error' } });
      });
    return () => {
      current = false;
    };
  }, [authorized, gameId, ply, userId, attempt, allowDailyInPlay, skip]);

  const reload = useCallback(() => {
    setFetched((previous) =>
      previous?.state.status === 'error' ? null : previous,
    );
    setAttempt((count) => count + 1);
  }, []);

  switch (source.kind) {
    case 'new':
      return {
        state: {
          status: 'ready',
          start: { startFen: DEFAULT_POSITION },
          orientation: 'w',
        },
        reload,
      };
    case 'import':
      return {
        state: {
          status: 'ready',
          start: { startFen: source.startFen, uciMoves: source.uciMoves },
          orientation: 'w',
        },
        reload,
      };
    case 'setup':
      return { state: { status: 'loading' }, reload };
    case 'game':
      return {
        state:
          fetched?.gameId === source.gameId
            ? fetched.state
            : { status: 'loading' },
        reload,
      };
  }
}

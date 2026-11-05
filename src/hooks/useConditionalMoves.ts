import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  addConditionalMoves,
  clearConditionalMoves,
  ConditionalLines,
  getConditionalMoves,
} from '../network/restClient';
import { GameMovePushPayload } from '../network/socketEvents';

export type ConditionalMovesState = {
  /** Null until they've loaded. */
  saved: ConditionalLines | null;
  /** Adds lines from the game's position after `basePly` moves; rejects
   * with the server's message. */
  add: (basePly: number, lines: string[][]) => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * Your conditional moves in a daily game - replies played for you the
 * moment the opponent makes a move you foresaw - fetched again with each
 * move the game sees, since one may have been played, or dropped them.
 */
export function useConditionalMoves(gameId: string): ConditionalMovesState {
  const session = useAuthSession();
  const { authorized } = session;
  const socket = session.isReady ? session.socket : null;
  const [saved, setSaved] = useState<ConditionalLines | null>(null);

  const reload = useCallback(() => {
    authorized((token) => getConditionalMoves(gameId, token))
      .then(setSaved)
      .catch(() => {});
  }, [authorized, gameId]);

  useEffect(() => reload(), [reload]);

  useEffect(() => {
    if (!socket) return;
    function handleMove(payload: GameMovePushPayload) {
      if (payload.gameId === gameId) reload();
    }
    socket.on('game:move', handleMove);
    return () => {
      socket.off('game:move', handleMove);
    };
  }, [socket, gameId, reload]);

  const add = useCallback(
    async (basePly: number, lines: string[][]) => {
      setSaved(
        await authorized((token) =>
          addConditionalMoves(gameId, basePly, lines, token),
        ),
      );
    },
    [authorized, gameId],
  );

  const clear = useCallback(async () => {
    await authorized((token) => clearConditionalMoves(gameId, token));
    setSaved({ basePly: null, lines: [] });
  }, [authorized, gameId]);

  return { saved, add, clear };
}

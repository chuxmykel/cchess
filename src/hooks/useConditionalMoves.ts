import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  ConditionalLines,
  getConditionalMoves,
  saveConditionalMoves,
} from '../network/restClient';
import { GameMovePushPayload } from '../network/socketEvents';

export type ConditionalMovesState = {
  /** Null until they've loaded. */
  saved: ConditionalLines | null;
  /** Saves these lines, from the game's position after `basePly` moves,
   * in place of those saved - none clears them; rejects with the server's
   * message. */
  save: (basePly: number, lines: string[][]) => Promise<void>;
  /** Fetches them again - saved elsewhere, say. */
  reload: () => void;
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

  const save = useCallback(
    async (basePly: number, lines: string[][]) => {
      setSaved(
        await authorized((token) =>
          saveConditionalMoves(gameId, basePly, lines, token),
        ),
      );
    },
    [authorized, gameId],
  );

  return { saved, save, reload };
}

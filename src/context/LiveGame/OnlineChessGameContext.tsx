import { createContext, useContext } from 'react';
import { Color } from 'chess.js';

import { AppSocket } from '../../network/socketClient';
import { GameSnapshot } from '../../network/socketEvents';
import {
  useOnlineChessGame,
  UseOnlineChessGameResult,
} from '../../hooks/useOnlineChessGame';
import { ChessGameContext } from '../ChessGameContext';

const OnlineChessGameContext = createContext<UseOnlineChessGameResult | null>(
  null,
);

// The online counterpart to ChessGameContext (which stays local/two-sided -
// it's also used by ChessBoard's own gesture tests to drive either color in
// one render, which a single-color-gated online game can't do). Scoped to
// the LiveGame screen the same way, just backed by useOnlineChessGame instead.
//
// Also provides through ChessGameContext itself: ChessBoard (and anything
// else under it) reads board/move state from ChessGameContext directly, not
// from this one, and UseOnlineChessGameResult is a structural superset of
// UseChessGameResult, so the same value satisfies both.
export const OnlineChessGameProvider: React.FC<{
  socket: AppSocket;
  gameId: string;
  myColor: Color;
  snapshot: GameSnapshot;
  onError?: (message: string) => void;
  children: React.ReactNode;
}> = ({ socket, gameId, myColor, snapshot, onError, children }) => {
  const chessGame = useOnlineChessGame(
    socket,
    gameId,
    myColor,
    snapshot,
    onError,
  );
  return (
    <OnlineChessGameContext.Provider value={chessGame}>
      <ChessGameContext.Provider value={chessGame}>
        {children}
      </ChessGameContext.Provider>
    </OnlineChessGameContext.Provider>
  );
};

export function useOnlineChessGameContext(): UseOnlineChessGameResult {
  const context = useContext(OnlineChessGameContext);
  if (!context) {
    throw new Error(
      'useOnlineChessGameContext must be used within an OnlineChessGameProvider',
    );
  }
  return context;
}

import { createContext, useContext } from 'react';

import { useChessGame, UseChessGameResult } from '../hooks/useChessGame';
import { PremoveControls } from '../hooks/usePremove';

// A game a board plays - and, for one against an opponent elsewhere, the
// moves it can queue while they think.
export type ChessGameContextValue = UseChessGameResult &
  Partial<PremoveControls>;

export const ChessGameContext = createContext<ChessGameContextValue | null>(
  null,
);

export const ChessGameProvider: React.FC<{
  fen?: string;
  children: React.ReactNode;
}> = ({ fen, children }) => {
  const chessGame = useChessGame(fen);
  return (
    <ChessGameContext.Provider value={chessGame}>
      {children}
    </ChessGameContext.Provider>
  );
};

export function useChessGameContext(): ChessGameContextValue {
  const context = useContext(ChessGameContext);
  if (!context) {
    throw new Error(
      'useChessGameContext must be used within a ChessGameProvider',
    );
  }
  return context;
}

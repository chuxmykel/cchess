import { createContext, useContext } from 'react';

import { useChessGame, UseChessGameResult } from '../hooks/useChessGame';

export const ChessGameContext = createContext<UseChessGameResult | null>(null);

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

export function useChessGameContext(): UseChessGameResult {
  const context = useContext(ChessGameContext);
  if (!context) {
    throw new Error(
      'useChessGameContext must be used within a ChessGameProvider',
    );
  }
  return context;
}

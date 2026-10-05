import { createContext, useContext } from "react";

import { useChessGame, UseChessGameResult } from "../../hooks/useChessGame";

const ChessGameContext = createContext<UseChessGameResult | null>(null);

// Scoped to the Game screen - exists only to remove the Game -> Chessboard ->
// Piece prop-drilling, not as app-wide state.
export const ChessGameProvider: React.FC<{ fen?: string; children: React.ReactNode }> = ({ fen, children }) => {
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
    throw new Error("useChessGameContext must be used within a ChessGameProvider");
  }
  return context;
}

import { createContext, MutableRefObject, useContext } from 'react';

import type { AnalysisSource } from '../../hooks/useAnalysisSource';
import type { GameReviewState } from '../../hooks/useGameReview';
import {
  ReviewSession,
  ReviewSessionInput,
  useReviewSession,
} from '../../hooks/useReviewSession';

// A game review's two screens - its summary, and the moves stepped through
// over it - are a stack of their own, sharing what's below.

// The review as it loads: the game fetched and analysed, what its facts
// are picked by, where the analysis board opens, and the move shown.
export type GameReviewLoad = {
  state: GameReviewState;
  seed: string;
  // The analysis board's source at a move - the game's end, left out.
  analysisAt: (ply?: number) => AnalysisSource;
  // The move shown, as a ply - where the header's analysis button opens
  // the board; read only when it's pressed - and how it's told.
  shownPly: MutableRefObject<number | null>;
  rememberShownPly: (ply: number) => void;
};

const GameReviewLoadContext = createContext<GameReviewLoad | null>(null);

export const GameReviewLoadProvider = GameReviewLoadContext.Provider;

export function useGameReviewLoad(): GameReviewLoad {
  const load = useContext(GameReviewLoadContext);
  if (!load) throw new Error('useGameReviewLoad outside a game review');
  return load;
}

// The review being looked through, once it's ready (useReviewSession).
const ReviewSessionContext = createContext<ReviewSession | null>(null);

export const ReviewSessionProvider: React.FC<
  ReviewSessionInput & { children: React.ReactNode }
> = ({ children, ...input }) => {
  const session = useReviewSession(input);
  return (
    <ReviewSessionContext.Provider value={session}>
      {children}
    </ReviewSessionContext.Provider>
  );
};

// Null until the review's ready.
export function useReviewSessionContext(): ReviewSession | null {
  return useContext(ReviewSessionContext);
}

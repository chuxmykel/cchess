import { useEffect, useState } from 'react';

import { REVIEW_PLAY_STEP_MS } from '../constants/review';

// While a game's analysed for its review, the board plays it through a move
// at a time, as quickly as the review plays moves on - but never past the
// moves analysed so far, `analysed`, so it keeps pace with the progress bar.
// The moves played so far.
export function useAnalysisPlayback(analysed: number): number {
  const [played, setPlayed] = useState(0);

  useEffect(() => {
    if (played >= analysed) return;
    const timer = setTimeout(
      () => setPlayed((count) => count + 1),
      REVIEW_PLAY_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [played, analysed]);

  return Math.min(played, analysed);
}

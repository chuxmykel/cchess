import { useCallback } from 'react';
import { Share } from 'react-native';

import { SHARE_FAILED_MESSAGE } from '../constants/errorMessages';
import { AnalysisTree } from '../domain/analysisTree';
import { analysisToPgn } from '../domain/pgnExport';

// An analysis shared through the native share sheet: the position shown as
// a FEN, or every move tried as a PGN, variations included - made here, so
// there's nothing to fetch.
export function useAnalysisShare(
  tree: AnalysisTree,
  fen: string,
  onError?: (message: string) => void,
): { shareFen: () => Promise<void>; sharePgn: () => Promise<void> } {
  const share = useCallback(
    async (message: string) => {
      try {
        await Share.share({ message });
      } catch {
        onError?.(SHARE_FAILED_MESSAGE);
      }
    },
    [onError],
  );
  const shareFen = useCallback(() => share(fen), [share, fen]);
  const sharePgn = useCallback(() => share(analysisToPgn(tree)), [share, tree]);
  return { shareFen, sharePgn };
}

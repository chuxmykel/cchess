import { act, renderHook } from '@testing-library/react-native';
import { Share } from 'react-native';
import { Chess, DEFAULT_POSITION } from 'chess.js';

import { useAnalysisShare } from '../useAnalysisShare';
import { treeFromMoves } from '../../domain/analysisTree';
import { SHARE_FAILED_MESSAGE } from '../../constants/errorMessages';

const START = new Chess(DEFAULT_POSITION).fen();
const { tree } = treeFromMoves(START, ['e2e4', 'e7e5']);
const FEN = tree.nodes[tree.nodes[tree.rootId].children[0]].fen;

describe('useAnalysisShare', () => {
  let share: jest.SpyInstance;
  beforeEach(() => {
    share = jest.spyOn(Share, 'share').mockResolvedValue({
      action: 'sharedAction',
      activityType: null,
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('shares the position shown as a FEN', async () => {
    const { result } = await renderHook(() => useAnalysisShare(tree, FEN));

    await act(() => result.current.shareFen());

    expect(share).toHaveBeenCalledWith({ message: FEN });
  });

  it('shares every move as a PGN', async () => {
    const { result } = await renderHook(() => useAnalysisShare(tree, FEN));

    await act(() => result.current.sharePgn());

    expect(share.mock.calls[0][0].message).toMatch(/\n\n1\. e4 e5 \*$/);
  });

  it("says so when the share sheet couldn't open", async () => {
    share.mockRejectedValue(new Error('no'));
    const onError = jest.fn();
    const { result } = await renderHook(() =>
      useAnalysisShare(tree, FEN, onError),
    );

    await act(() => result.current.shareFen());

    expect(onError).toHaveBeenCalledWith(SHARE_FAILED_MESSAGE);
  });
});

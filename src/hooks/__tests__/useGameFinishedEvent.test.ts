import { renderHook } from '@testing-library/react-native';

import { analytics } from '../../analytics/analytics';
import { FinishedGame, useGameFinishedEvent } from '../useGameFinishedEvent';

jest.mock('../../analytics/analytics', () => ({
  analytics: { capture: jest.fn() },
}));

const GAME: FinishedGame = {
  isGameOver: false,
  gameStatus: 'active',
  gameType: 'blitz',
  rated: true,
  myColor: 'w',
  result: null,
  resultReason: null,
};

describe('useGameFinishedEvent', () => {
  afterEach(() => jest.clearAllMocks());

  it('reports a game as it ends, from my side, once', async () => {
    const { rerender } = await renderHook(
      (game: FinishedGame) => useGameFinishedEvent(game),
      { initialProps: GAME },
    );
    const over = {
      ...GAME,
      isGameOver: true,
      gameStatus: 'completed',
      result: 'black' as const,
      resultReason: 'checkmate',
    };
    await rerender(over);
    await rerender({ ...over });

    expect(analytics.capture).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith('game_finished', {
      gameType: 'blitz',
      rated: true,
      status: 'completed',
      result: 'loss',
      reason: 'checkmate',
    });
  });

  it("doesn't report a game already over when it opened", async () => {
    await renderHook(() =>
      useGameFinishedEvent({ ...GAME, isGameOver: true, result: 'draw' }),
    );
    expect(analytics.capture).not.toHaveBeenCalled();
  });
});

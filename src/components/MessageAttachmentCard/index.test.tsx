import { fireEvent, render } from '@testing-library/react-native';

import MessageAttachmentCard from '.';
import { useGameSummary } from '../../hooks/useGameSummary';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../hooks/useGameSummary', () => ({
  useGameSummary: jest.fn(),
}));

describe('MessageAttachmentCard', () => {
  async function renderGameCard() {
    const onOpenGame = jest.fn();
    const screen = await render(
      <MessageAttachmentCard
        attachment={{ kind: 'game', gameId: 'game-1' }}
        onOpenGame={onOpenGame}
        onOpenPosition={jest.fn()}
        testID="card"
      />,
    );
    return { screen, onOpenGame };
  }

  it("names a shared game's players and result, and opens it", async () => {
    (useGameSummary as jest.Mock).mockReturnValue(
      makeGameSnapshot({
        id: 'game-1',
        status: 'completed',
        result: 'black',
        gameType: 'blitz',
      }),
    );
    const { screen, onOpenGame } = await renderGameCard();

    expect(screen.getByText(/ vs /)).toBeTruthy();
    expect(screen.getByText('0-1 · Blitz')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('card'));
    expect(onOpenGame).toHaveBeenCalledWith('game-1');
  });

  it('says a game is still being played', async () => {
    (useGameSummary as jest.Mock).mockReturnValue(
      makeGameSnapshot({ status: 'active', result: null, gameType: 'rapid' }),
    );
    const { screen } = await renderGameCard();

    expect(screen.getByText('In progress · Rapid')).toBeTruthy();
  });

  it("says when a game can't be shown, and doesn't open it", async () => {
    (useGameSummary as jest.Mock).mockReturnValue('error');
    const { screen, onOpenGame } = await renderGameCard();

    expect(screen.getByText('This game can’t be shown')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('card'));
    expect(onOpenGame).not.toHaveBeenCalled();
  });
});

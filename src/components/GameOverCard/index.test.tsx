import { fireEvent, render } from '@testing-library/react-native';

import GameOverCard, { RESULT_LABELS, REASON_LABELS } from '.';
import { GAME_RESULT_REASON } from '../../network/socketEvents';

describe('GameOverCard', () => {
  it('shows a win for the local color matching the winning side', async () => {
    const screen = await render(
      <GameOverCard
        result="white"
        myColor="w"
        resultReason={GAME_RESULT_REASON.RESIGNATION}
        onNewOpponent={jest.fn()}
      />,
    );

    expect(screen.getByText(RESULT_LABELS.win)).toBeTruthy();
    expect(
      screen.getByText(REASON_LABELS[GAME_RESULT_REASON.RESIGNATION]),
    ).toBeTruthy();
  });

  it('shows a loss for the local color matching the losing side', async () => {
    const screen = await render(
      <GameOverCard
        result="white"
        myColor="b"
        resultReason={GAME_RESULT_REASON.RESIGNATION}
        onNewOpponent={jest.fn()}
      />,
    );

    expect(screen.getByText(RESULT_LABELS.loss)).toBeTruthy();
  });

  it('shows a draw regardless of color', async () => {
    const screen = await render(
      <GameOverCard
        result="draw"
        myColor="w"
        resultReason={GAME_RESULT_REASON.DRAW_AGREEMENT}
        onNewOpponent={jest.fn()}
      />,
    );

    expect(screen.getByText(RESULT_LABELS.draw)).toBeTruthy();
    expect(
      screen.getByText(REASON_LABELS[GAME_RESULT_REASON.DRAW_AGREEMENT]),
    ).toBeTruthy();
  });

  it('says the game was aborted, without a separate reason line', async () => {
    const screen = await render(
      <GameOverCard
        result={null}
        myColor="w"
        resultReason={GAME_RESULT_REASON.ABORT}
        onNewOpponent={jest.fn()}
      />,
    );

    expect(screen.getByText('Game aborted')).toBeTruthy();
    expect(
      screen.queryByText(REASON_LABELS[GAME_RESULT_REASON.ABORT]),
    ).toBeNull();
  });

  it('starts looking for a new opponent', async () => {
    const onNewOpponent = jest.fn();
    const screen = await render(
      <GameOverCard
        result="draw"
        myColor="w"
        resultReason={null}
        onNewOpponent={onNewOpponent}
      />,
    );

    await fireEvent.press(screen.getByTestId('new-opponent-button'));

    expect(onNewOpponent).toHaveBeenCalledTimes(1);
  });
});

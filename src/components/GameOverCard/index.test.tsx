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
        myRating={null}
        myRatingDiff={null}
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
        myRating={null}
        myRatingDiff={null}
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
        myRating={null}
        myRatingDiff={null}
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
        myRating={null}
        myRatingDiff={null}
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
        myRating={null}
        myRatingDiff={null}
        onNewOpponent={onNewOpponent}
      />,
    );

    await fireEvent.press(screen.getByTestId('new-opponent-button'));

    expect(onNewOpponent).toHaveBeenCalledTimes(1);
  });

  describe('rating', () => {
    function renderFinishedRatedGame(myRatingDiff: number) {
      return render(
        <GameOverCard
          result="white"
          myColor="w"
          resultReason={GAME_RESULT_REASON.CHECKMATE}
          myRating={1520}
          myRatingDiff={myRatingDiff}
          onNewOpponent={jest.fn()}
        />,
      );
    }

    it('shows the new rating and the gain after a rated win', async () => {
      const screen = await renderFinishedRatedGame(12);

      expect(screen.getByText('Rating 1532')).toBeTruthy();
      expect(screen.getByText('+12')).toBeTruthy();
    });

    it('shows a loss with a minus sign', async () => {
      const screen = await renderFinishedRatedGame(-12);

      expect(screen.getByText('Rating 1508')).toBeTruthy();
      expect(screen.getByText('\u221212')).toBeTruthy();
    });

    it("shows no rating for a game that didn't change it", async () => {
      const screen = await render(
        <GameOverCard
          result="white"
          myColor="w"
          resultReason={GAME_RESULT_REASON.CHECKMATE}
          myRating={1520}
          myRatingDiff={null}
          onNewOpponent={jest.fn()}
        />,
      );

      expect(screen.queryByTestId('game-over-rating')).toBeNull();
    });
  });

  it('names the winner for someone who watched the game', async () => {
    const screen = await render(
      <GameOverCard
        result="black"
        myColor={null}
        resultReason={GAME_RESULT_REASON.CHECKMATE}
        myRating={null}
        myRatingDiff={null}
        onNewOpponent={jest.fn()}
      />,
    );

    expect(screen.getByText('Black won')).toBeTruthy();
    expect(screen.getByText(REASON_LABELS.checkmate)).toBeTruthy();
  });

  it('can be dismissed when given a way to close it', async () => {
    const onDismiss = jest.fn();
    const screen = await render(
      <GameOverCard
        result="draw"
        myColor="w"
        resultReason={GAME_RESULT_REASON.STALEMATE}
        myRating={null}
        myRatingDiff={null}
        onNewOpponent={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    await fireEvent.press(screen.getByTestId('game-over-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });
});

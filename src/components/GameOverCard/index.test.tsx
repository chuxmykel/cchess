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

  it('says what its new-game button does when told', async () => {
    const screen = await render(
      <GameOverCard
        result="white"
        myColor={null}
        resultReason={null}
        myRating={null}
        myRatingDiff={null}
        onNewOpponent={jest.fn()}
        newGameLabel="Play 5+0"
      />,
    );

    expect(screen.getByTestId('new-opponent-button')).toHaveTextContent(
      'Play 5+0',
    );
  });

  describe('rematch', () => {
    async function renderWithRematch(
      status: 'none' | 'offered' | 'received' | 'declined',
    ) {
      const onOffer = jest.fn();
      const onDecline = jest.fn();
      const screen = await render(
        <GameOverCard
          result="white"
          myColor="w"
          resultReason={null}
          myRating={null}
          myRatingDiff={null}
          onNewOpponent={jest.fn()}
          rematch={{ status, onOffer, onDecline }}
        />,
      );
      return { screen, onOffer, onDecline };
    }

    it('offers a rematch', async () => {
      const { screen, onOffer } = await renderWithRematch('none');

      await fireEvent.press(screen.getByTestId('rematch-button'));

      expect(onOffer).toHaveBeenCalledTimes(1);
    });

    it('waits on an offer made, which can be withdrawn', async () => {
      const { screen, onDecline } = await renderWithRematch('offered');

      expect(screen.getByTestId('rematch-status')).toHaveTextContent(
        'Rematch sent',
      );
      await fireEvent.press(screen.getByTestId('rematch-cancel-button'));
      expect(onDecline).toHaveBeenCalledTimes(1);
    });

    it("answers the opponent's offer", async () => {
      const { screen, onOffer, onDecline } =
        await renderWithRematch('received');

      expect(screen.getByTestId('rematch-status')).toHaveTextContent(
        'Rematch offered',
      );
      expect(screen.getByLabelText('Accept rematch')).toBeTruthy();
      expect(screen.getByLabelText('Decline rematch')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('rematch-accept-button'));
      await fireEvent.press(screen.getByTestId('rematch-decline-button'));
      expect(onOffer).toHaveBeenCalledTimes(1);
      expect(onDecline).toHaveBeenCalledTimes(1);
    });

    it('says when the opponent declined', async () => {
      const { screen } = await renderWithRematch('declined');

      expect(screen.getByTestId('rematch-status')).toHaveTextContent(
        'Rematch declined',
      );
      expect(screen.queryByTestId('rematch-button')).toBeNull();
    });

    it("isn't offered without a way to rematch", async () => {
      const screen = await render(
        <GameOverCard
          result="white"
          myColor={null}
          resultReason={null}
          myRating={null}
          myRatingDiff={null}
          onNewOpponent={jest.fn()}
        />,
      );

      expect(screen.queryByTestId('rematch-button')).toBeNull();
    });
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

import { fireEvent, render } from '@testing-library/react-native';

import GameOverBanner, { RESULT_LABELS, REASON_LABELS } from '.';
import { GAME_RESULT_REASON } from '../../network/socketEvents';
import { withSafeArea } from '../../testUtils/safeArea';

describe('GameOverBanner', () => {
  it('shows a win for the local color matching the winning side', async () => {
    const screen = await render(
      withSafeArea(
        <GameOverBanner
          visible={true}
          result="white"
          myColor="w"
          resultReason={GAME_RESULT_REASON.RESIGNATION}
          onDone={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(RESULT_LABELS.win)).toBeTruthy();
    expect(
      screen.getByText(REASON_LABELS[GAME_RESULT_REASON.RESIGNATION]),
    ).toBeTruthy();
  });

  it('shows a loss for the local color matching the losing side', async () => {
    const screen = await render(
      withSafeArea(
        <GameOverBanner
          visible={true}
          result="white"
          myColor="b"
          resultReason={GAME_RESULT_REASON.RESIGNATION}
          onDone={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(RESULT_LABELS.loss)).toBeTruthy();
  });

  it('shows a draw regardless of color', async () => {
    const screen = await render(
      withSafeArea(
        <GameOverBanner
          visible={true}
          result="draw"
          myColor="w"
          resultReason={GAME_RESULT_REASON.DRAW_AGREEMENT}
          onDone={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(RESULT_LABELS.draw)).toBeTruthy();
    expect(
      screen.getByText(REASON_LABELS[GAME_RESULT_REASON.DRAW_AGREEMENT]),
    ).toBeTruthy();
  });

  it('shows a neutral message for a null result (e.g. an aborted game)', async () => {
    const screen = await render(
      withSafeArea(
        <GameOverBanner
          visible={true}
          result={null}
          myColor="w"
          resultReason={GAME_RESULT_REASON.ABORT}
          onDone={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText('Game Over')).toBeTruthy();
    expect(
      screen.getByText(REASON_LABELS[GAME_RESULT_REASON.ABORT]),
    ).toBeTruthy();
  });

  it('calls onDone when the Done button is pressed', async () => {
    const onDone = jest.fn();
    const screen = await render(
      withSafeArea(
        <GameOverBanner
          visible={true}
          result="draw"
          myColor="w"
          resultReason={null}
          onDone={onDone}
        />,
      ),
    );

    await fireEvent.press(screen.getByTestId('game-over-done-button'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import GameControls from '.';

function baseProps() {
  return {
    canAbort: false,
    drawOfferedByOpponent: false,
    drawOfferedByMe: false,
    onResign: jest.fn(),
    onAbort: jest.fn(),
    onOfferDraw: jest.fn(),
    onAcceptDraw: jest.fn(),
    onDeclineDraw: jest.fn(),
  };
}

describe('GameControls', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Resign (not Abort) once a move has been made, and confirms before calling onResign', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    const props = baseProps();
    const screen = await render(<GameControls {...props} />);

    expect(screen.queryByTestId('abort-button')).toBeNull();
    await fireEvent.press(screen.getByTestId('resign-button'));

    expect(props.onResign).toHaveBeenCalledTimes(1);
  });

  it('shows Abort instead of Resign when no move has been made yet, and confirms before calling onAbort', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    const props = { ...baseProps(), canAbort: true };
    const screen = await render(<GameControls {...props} />);

    expect(screen.queryByTestId('resign-button')).toBeNull();
    await fireEvent.press(screen.getByTestId('abort-button'));

    expect(props.onAbort).toHaveBeenCalledTimes(1);
  });

  it('does not resign/abort when the confirmation is cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.[0]?.onPress?.();
    });
    const props = baseProps();
    const screen = await render(<GameControls {...props} />);

    await fireEvent.press(screen.getByTestId('resign-button'));

    expect(props.onResign).not.toHaveBeenCalled();
  });

  it('calls onOfferDraw and disables the button once already offered', async () => {
    const props = baseProps();
    const screen = await render(<GameControls {...props} />);

    await fireEvent.press(screen.getByTestId('offer-draw-button'));
    expect(props.onOfferDraw).toHaveBeenCalledTimes(1);

    const offered = await render(
      <GameControls {...props} drawOfferedByMe={true} />,
    );
    expect(offered.getByText('Draw Offered')).toBeTruthy();

    await fireEvent.press(offered.getByTestId('offer-draw-button'));
    expect(props.onOfferDraw).toHaveBeenCalledTimes(1); // still called only once.
  });

  it('shows accept/decline instead of resign/draw when the opponent has offered a draw', async () => {
    const props = { ...baseProps(), drawOfferedByOpponent: true };
    const screen = await render(<GameControls {...props} />);

    expect(screen.queryByTestId('resign-button')).toBeNull();
    expect(screen.queryByTestId('offer-draw-button')).toBeNull();

    await fireEvent.press(screen.getByTestId('accept-draw-button'));
    expect(props.onAcceptDraw).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('decline-draw-button'));
    expect(props.onDeclineDraw).toHaveBeenCalledTimes(1);
  });
});

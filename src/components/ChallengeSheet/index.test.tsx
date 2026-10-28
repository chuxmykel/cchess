import { fireEvent, render } from '@testing-library/react-native';

import ChallengeSheet from '.';
import { ApiError } from '../../network/restClient';
import { withSafeArea } from '../../testUtils/safeArea';

describe('ChallengeSheet', () => {
  function renderSheet(
    overrides: Partial<React.ComponentProps<typeof ChallengeSheet>> = {},
  ) {
    const props = {
      opponentName: 'Judit',
      canPlayRated: true,
      onClose: jest.fn(),
      onSend: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    return {
      props,
      screenPromise: render(withSafeArea(<ChallengeSheet {...props} />)),
    };
  }

  it('sends the chosen time control, rated by default, then closes', async () => {
    const { props, screenPromise } = renderSheet();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('challenge-time-3+2'));
    await fireEvent.press(screen.getByTestId('send-challenge-button'));

    expect(props.onSend).toHaveBeenCalledWith({
      timeControl: expect.objectContaining({
        initialSeconds: 180,
        incrementSeconds: 2,
      }),
      rated: true,
    });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('sends a casual challenge when Rated is switched off', async () => {
    const { props, screenPromise } = renderSheet();
    const screen = await screenPromise;

    await fireEvent(
      screen.getByTestId('challenge-rated-switch'),
      'valueChange',
      false,
    );
    await fireEvent.press(screen.getByTestId('send-challenge-button'));

    expect(props.onSend).toHaveBeenCalledWith(
      expect.objectContaining({ rated: false }),
    );
  });

  it('offers only casual games to a guest', async () => {
    const { props, screenPromise } = renderSheet({ canPlayRated: false });
    const screen = await screenPromise;

    expect(screen.queryByTestId('challenge-rated-switch')).toBeNull();
    await fireEvent.press(screen.getByTestId('send-challenge-button'));
    expect(props.onSend).toHaveBeenCalledWith(
      expect.objectContaining({ rated: false }),
    );
  });

  it("shows the server's reason and stays open when sending fails", async () => {
    const { props, screenPromise } = renderSheet({
      onSend: jest
        .fn()
        .mockRejectedValue(new ApiError(403, 'You can only challenge friends')),
    });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('send-challenge-button'));

    expect(screen.getByTestId('challenge-error')).toHaveTextContent(
      'You can only challenge friends',
    );
    expect(props.onClose).not.toHaveBeenCalled();
  });
});

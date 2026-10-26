import { fireEvent, render } from '@testing-library/react-native';

import SeekingContent from './SeekingContent';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../components/ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

describe('SeekingContent', () => {
  function renderContent({ isConnecting = false, onCancel = jest.fn() } = {}) {
    return render(
      withSafeArea(
        <SeekingContent
          width={400}
          timeControl={DEFAULT_TIME_CONTROL}
          isConnecting={isConnecting}
          onCancel={onCancel}
        />,
      ),
    );
  }

  it('waits for an opponent on an empty board', async () => {
    const screen = await renderContent();

    expect(screen.getByText('Waiting for opponent to join…')).toBeTruthy();
    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
    expect(screen.queryByTestId(/^piece-/)).toBeNull();
  });

  it('shows the time control in the header and on the card', async () => {
    const screen = await renderContent();

    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Casual`),
    ).toBeTruthy();
    expect(screen.getByText(DEFAULT_TIME_CONTROL.label)).toBeTruthy();
  });

  it('says it is connecting until the session is ready', async () => {
    const screen = await renderContent({ isConnecting: true });

    expect(screen.getByText('Connecting…')).toBeTruthy();
  });

  it('cancels from the bottom bar', async () => {
    const onCancel = jest.fn();
    const screen = await renderContent({ onCancel });

    await fireEvent.press(screen.getByTestId('matchmaking-cancel-button'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

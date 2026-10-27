import { fireEvent, render } from '@testing-library/react-native';

import SeekingContent from './SeekingContent';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { Seek } from '../../constants/seek';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../components/ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

const SEEK: Seek = {
  timeControl: DEFAULT_TIME_CONTROL,
  rated: true,
  ratingRange: { below: 200, above: 500 },
};

describe('SeekingContent', () => {
  function renderContent({
    isConnecting = false,
    isRated = false,
    myRating = null as number | null,
    onCancel = jest.fn(),
  } = {}) {
    return render(
      withSafeArea(
        <SeekingContent
          width={400}
          seek={SEEK}
          isRated={isRated}
          myRating={myRating}
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

  it('says when the seek is rated', async () => {
    const screen = await renderContent({ isRated: true });

    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Rated`),
    ).toBeTruthy();
  });

  it('shows the ratings it will pair with, around your own', async () => {
    const screen = await renderContent({ myRating: 1500 });

    expect(screen.getByText('1300–2000')).toBeTruthy();
  });

  it('shows no rating range for a guest, who has no rating', async () => {
    const screen = await renderContent({ myRating: null });

    expect(screen.queryByTestId('seek-card-rating-range')).toBeNull();
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

import { render } from '@testing-library/react-native';

import LiveGameSkeleton from '.';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

describe('LiveGameSkeleton', () => {
  it('shows an empty board at the given width', async () => {
    const screen = await render(withSafeArea(<LiveGameSkeleton width={320} />));

    expect(screen.getByTestId('live-game-skeleton')).toBeTruthy();
    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
    expect(screen.queryByTestId(/^piece-/)).toBeNull();
  });

  it('shows the connection indicator while loading', async () => {
    const screen = await render(withSafeArea(<LiveGameSkeleton width={320} />));

    expect(screen.getByTestId('connection-strength-indicator')).toBeTruthy();
  });

  it('shows the time control in the header once it is known', async () => {
    const screen = await render(
      withSafeArea(
        <LiveGameSkeleton
          width={320}
          timeControl={DEFAULT_TIME_CONTROL}
          rated={false}
        />,
      ),
    );

    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Casual`),
    ).toBeTruthy();
    expect(screen.queryByTestId('game-header-placeholder')).toBeNull();
  });

  it('shows a placeholder title when the time control is not known yet', async () => {
    const screen = await render(withSafeArea(<LiveGameSkeleton width={320} />));

    expect(screen.getByTestId('game-header-placeholder')).toBeTruthy();
  });
});

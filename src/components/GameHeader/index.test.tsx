import { fireEvent, render } from '@testing-library/react-native';

import GameHeader from '.';
import { TimeControl } from '../../constants/timeControls';

jest.mock('../ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

describe('GameHeader', () => {
  const bullet2Plus1: TimeControl = {
    type: 'bullet',
    label: '2+1',
    initialSeconds: 120,
    incrementSeconds: 1,
  };

  it('shows the time control and whether the game is rated', async () => {
    const rated = await render(<GameHeader timeControl={bullet2Plus1} rated />);
    expect(rated.getByText('2+1 • Rated')).toBeTruthy();

    const casual = await render(
      <GameHeader timeControl={bullet2Plus1} rated={false} />,
    );
    expect(casual.getByText('2+1 • Casual')).toBeTruthy();
  });

  it('shows the connection indicator, not a back button, by default', async () => {
    const screen = await render(
      <GameHeader timeControl={bullet2Plus1} rated />,
    );

    expect(screen.getByTestId('connection-strength-indicator')).toBeTruthy();
    expect(screen.queryByTestId('game-header-back')).toBeNull();
  });

  it('swaps the connection indicator for a back button when onBack is given', async () => {
    const onBack = jest.fn();
    const screen = await render(
      <GameHeader timeControl={bullet2Plus1} rated onBack={onBack} />,
    );

    expect(screen.queryByTestId('connection-strength-indicator')).toBeNull();
    await fireEvent.press(screen.getByTestId('game-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('only shows the ⋯ menu when menu items are given', async () => {
    const withoutMenu = await render(
      <GameHeader timeControl={bullet2Plus1} rated />,
    );
    expect(withoutMenu.queryByTestId('game-header-menu')).toBeNull();

    const withMenu = await render(
      <GameHeader
        timeControl={bullet2Plus1}
        rated
        menuItems={[{ label: 'Share & export', onPress: jest.fn() }]}
      />,
    );
    expect(withMenu.getByTestId('game-header-menu')).toBeTruthy();
    expect(withMenu.getByTestId('popover-menu-trigger-icon')).toHaveProp(
      'name',
      'dots-horizontal',
    );
  });

  it('shows a placeholder title, but still the connection indicator, before the game is known', async () => {
    const screen = await render(<GameHeader />);

    expect(screen.getByTestId('game-header-placeholder')).toBeTruthy();
    expect(screen.getByTestId('connection-strength-indicator')).toBeTruthy();
  });

  it('shows a subtitle under the title', async () => {
    const screen = await render(
      <GameHeader timeControl={bullet2Plus1} subtitle="16 hours ago" />,
    );

    expect(screen.getByTestId('game-header-subtitle')).toHaveTextContent(
      '16 hours ago',
    );
  });
});

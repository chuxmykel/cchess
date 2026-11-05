import { render } from '@testing-library/react-native';

import GameTypeIcon from '.';
import { GameType } from '../../domain/types';
import { lightTheme } from '../../theme';

describe('GameTypeIcon', () => {
  it.each<[GameType, string]>([
    ['bullet', 'bullet'],
    ['blitz', 'fire'],
    ['rapid', 'clock-fast'],
    ['classical', 'timer-sand'],
  ])('shows %s as the %s icon, in its game type color', async (type, name) => {
    const screen = await render(<GameTypeIcon type={type} />);

    const icon = screen.getByTestId(`game-type-icon-${type}`);
    expect(icon).toHaveProp('name', name);
    expect(icon).toHaveProp('color', lightTheme.colors.gameType[type]);
  });
});

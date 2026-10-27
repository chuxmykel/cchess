import { render } from '@testing-library/react-native';

import GameTypeIcon from '.';
import { GAME_TYPE_COLORS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';

describe('GameTypeIcon', () => {
  it.each<[GameType, string]>([
    ['bullet', 'lightning-bolt'],
    ['blitz', 'fire'],
    ['rapid', 'rabbit'],
    ['classical', 'chess-pawn'],
  ])('shows %s as the %s icon, in its game type color', async (type, name) => {
    const screen = await render(<GameTypeIcon type={type} />);

    const icon = screen.getByTestId(`game-type-icon-${type}`);
    expect(icon).toHaveProp('name', name);
    expect(icon).toHaveProp('color', GAME_TYPE_COLORS[type]);
  });
});

import { render } from '@testing-library/react-native';

import GameTypeIcon from '.';
import { GameType } from '../../domain/types';

describe('GameTypeIcon', () => {
  it.each<[GameType, string]>([
    ['bullet', '⚡'],
    ['blitz', '\u{1F525}'],
    ['rapid', '\u{1F430}'],
    ['classical', '♟'],
  ])('renders the correct glyph for %s', async (type, glyph) => {
    const screen = await render(<GameTypeIcon type={type} />);

    expect(screen.getByText(glyph)).toBeTruthy();
  });
});

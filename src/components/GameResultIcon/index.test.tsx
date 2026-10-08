import { render } from '@testing-library/react-native';

import GameResultIcon from '.';
import { GameResult } from '../../domain/types';

describe('GameResultIcon', () => {
  it.each<[GameResult, string]>([
    ['win', '✓'],
    ['loss', '✕'],
    ['draw', '='],
  ])('renders the correct glyph for %s', async (result, glyph) => {
    const screen = await render(<GameResultIcon result={result} />);

    expect(screen.getByText(glyph)).toBeTruthy();
  });

  it('colors a win and a loss differently', async () => {
    const win = await render(<GameResultIcon result="win" />);
    const loss = await render(<GameResultIcon result="loss" />);

    const winColor = win.getByText('✓').props.style.color;
    const lossColor = loss.getByText('✕').props.style.color;

    expect(winColor).not.toBe(lossColor);
  });
});

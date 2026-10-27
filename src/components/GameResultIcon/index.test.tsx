import { render } from '@testing-library/react-native';

import GameResultIcon from '.';
import { GameResult } from '../../domain/types';

describe('GameResultIcon', () => {
  it.each<[GameResult, string]>([
    ['win', 'check'],
    ['loss', 'close'],
    ['draw', 'equal'],
  ])('shows a %s as the %s icon', async (result, name) => {
    const screen = await render(<GameResultIcon result={result} />);

    expect(screen.getByTestId(`game-result-icon-${result}`)).toHaveProp(
      'name',
      name,
    );
  });

  it('colors a win and a loss differently', async () => {
    const win = await render(<GameResultIcon result="win" />);
    const loss = await render(<GameResultIcon result="loss" />);

    const winColor = win.getByTestId('game-result-icon-win').props.color;
    const lossColor = loss.getByTestId('game-result-icon-loss').props.color;

    expect(winColor).not.toBe(lossColor);
  });
});

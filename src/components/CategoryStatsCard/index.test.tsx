import { fireEvent, render } from '@testing-library/react-native';

import CategoryStatsCard from '.';
import { makeRatingStats } from '../../testUtils/ratingStats';

describe('CategoryStatsCard', () => {
  it('shows the games, results, time spent and streaks', async () => {
    const screen = await render(
      <CategoryStatsCard stats={makeRatingStats()} onOpenGame={jest.fn()} />,
    );

    expect(screen.getByTestId('stats-games')).toHaveTextContent('12');
    expect(screen.getByTestId('stats-wins')).toHaveTextContent('6Wins · 50%');
    expect(screen.getByTestId('stats-draws')).toHaveTextContent('2Draws · 17%');
    expect(screen.getByTestId('stats-losses')).toHaveTextContent(
      '4Losses · 33%',
    );
    expect(screen.getByTestId('stats-time-played')).toHaveTextContent(
      'Time spent playing2 hours',
    );
    expect(screen.getByTestId('stats-win-streak')).toHaveTextContent(
      'Best win streak4 games',
    );
    expect(screen.getByTestId('stats-losing-streak')).toHaveTextContent(
      'Worst losing streak2 games',
    );
  });

  it('opens the best win and worst loss', async () => {
    const onOpenGame = jest.fn();
    const screen = await render(
      <CategoryStatsCard stats={makeRatingStats()} onOpenGame={onOpenGame} />,
    );

    expect(screen.getByTestId('stats-best-win')).toHaveTextContent(
      'Best winMagnus (1820)',
    );
    await fireEvent.press(screen.getByTestId('stats-best-win'));
    await fireEvent.press(screen.getByTestId('stats-worst-loss'));

    expect(onOpenGame.mock.calls).toEqual([['game-best'], ['game-worst']]);
  });

  it('shows a dash for a best win or worst loss there was none of', async () => {
    const screen = await render(
      <CategoryStatsCard
        stats={makeRatingStats({
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          bestWin: null,
          worstLoss: null,
        })}
        onOpenGame={jest.fn()}
      />,
    );

    expect(screen.getByTestId('stats-best-win')).toHaveTextContent('Best win—');
    expect(screen.getByTestId('stats-best-win')).toBeDisabled();
    expect(screen.getByTestId('stats-wins')).toHaveTextContent('0Wins · 0%');
  });
});

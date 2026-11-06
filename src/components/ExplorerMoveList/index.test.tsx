import { fireEvent, render } from '@testing-library/react-native';

import ExplorerMoveList from '.';
import { ExplorerMoveRow } from '../../hooks/useExplorerMoves';

const AFTER_E4_E5 =
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

const row = (
  uci: string,
  san: string,
  games: number | null,
): ExplorerMoveRow => ({
  uci,
  san,
  opening: null,
  results:
    games === null
      ? null
      : {
          uci,
          san,
          games,
          whiteWins: Math.round(games / 2),
          draws: 0,
          blackWins: games - Math.round(games / 2),
        },
});

const TOTALS = { games: 1500, whiteWins: 750, draws: 300, blackWins: 450 };

async function renderList(
  props: Partial<React.ComponentProps<typeof ExplorerMoveList>> = {},
) {
  const onPlayMove = jest.fn();
  const screen = await render(
    <ExplorerMoveList
      fen={AFTER_E4_E5}
      opening={null}
      moves={[row('g1f3', 'Nf3', 1200), row('f1c4', 'Bc4', 300)]}
      status="ready"
      totals={TOTALS}
      db="lichess"
      source="lichess"
      onPlayMove={onPlayMove}
      {...props}
    />,
  );
  return { onPlayMove, ...screen };
}

describe('ExplorerMoveList', () => {
  it("shows each move's games and its share of the position's", async () => {
    const screen = await renderList();

    expect(screen.getByTestId('explorer-games-g1f3')).toHaveTextContent(
      '1,200',
    );
    expect(screen.getByTestId('explorer-share-g1f3')).toHaveTextContent('80%');
    expect(screen.getByTestId('explorer-share-f1c4')).toHaveTextContent('20%');
  });

  it('ends with Σ, the position’s own games and how they ended', async () => {
    const screen = await renderList();

    expect(screen.getByTestId('explorer-totals')).toHaveTextContent(/^Σ/);
    expect(screen.getByTestId('explorer-games-totals')).toHaveTextContent(
      '1,500',
    );
    expect(
      screen.getByTestId('explorer-results-totals').props.accessibilityLabel,
    ).toBe('1500 games: white won 50%, drawn 20%, black won 30%');
  });

  it('shows no share or Σ before the answer comes', async () => {
    const screen = await renderList({
      moves: [row('g1f3', 'Nf3', null)],
      status: 'loading',
      totals: null,
      source: null,
    });

    expect(screen.getByTestId('explorer-share-g1f3')).toHaveTextContent('');
    expect(screen.queryByTestId('explorer-totals')).toBeNull();
  });

  it('says when lichess was out of reach and the games here answered', async () => {
    const screen = await renderList({ db: 'masters', source: 'cchess' });

    expect(screen.getByTestId('explorer-fallback')).toHaveTextContent(
      'Masters is out of reach right now - showing games played here',
    );
    expect((await renderList()).queryByTestId('explorer-fallback')).toBeNull();
  });

  it('says No results only once the answer has come', async () => {
    const loading = await renderList({ moves: [], status: 'loading' });
    expect(loading.queryByTestId('explorer-empty')).toBeNull();

    const ready = await renderList({ moves: [], status: 'ready' });
    expect(ready.getByTestId('explorer-empty')).toHaveTextContent('No results');
  });

  it('plays a move tapped', async () => {
    const { getByTestId, onPlayMove } = await renderList();

    await fireEvent.press(getByTestId('explorer-move-f1c4'));

    expect(onPlayMove).toHaveBeenCalledWith('f1c4');
  });
});

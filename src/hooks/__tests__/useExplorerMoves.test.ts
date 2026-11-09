import { act, renderHook } from '@testing-library/react-native';

import { useExplorerMoves } from '../useExplorerMoves';
import { EXPLORER_FETCH_DELAY_MS } from '../../constants/explorer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ExplorerQuery, getExplorer } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getExplorer: jest.fn(),
}));

const AFTER_E4_E5 =
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const LICHESS: ExplorerQuery = {
  db: 'lichess',
  speeds: ['blitz'],
  ratings: [2000],
};
const results = (uci: string, san: string, games: number) => ({
  uci,
  san,
  games,
  whiteWins: games,
  draws: 0,
  blackWins: 0,
});

describe('useExplorerMoves', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("lists the book moves at once, then the database's, the most played first", async () => {
    let respond: (value: unknown) => void = () => {};
    (getExplorer as jest.Mock).mockReturnValue(
      new Promise((resolve) => (respond = resolve)),
    );
    const { result } = await renderHook(() =>
      useExplorerMoves(AFTER_E4_E5, LICHESS),
    );

    expect(result.current.status).toBe('loading');
    expect(result.current.moves.length).toBeGreaterThan(3);
    expect(result.current.moves.every((move) => move.results === null)).toBe(
      true,
    );

    await act(async () => {
      jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
    });
    await act(async () =>
      respond({
        source: 'lichess',
        stale: true,
        totalGames: 9,
        whiteWins: 9,
        draws: 0,
        blackWins: 0,
        moves: [
          results('g1f3', 'Nf3', 5),
          // Played, but not in the book.
          results('g2g4', 'g4', 3),
          results('f2f4', 'f4', 1),
        ],
      }),
    );

    const [first, second, third, fourth] = result.current.moves;
    expect(first).toMatchObject({
      uci: 'g1f3',
      opening: { name: "King's Knight Opening" },
      results: { games: 5 },
    });
    expect(second).toEqual({
      uci: 'g2g4',
      san: 'g4',
      opening: null,
      results: results('g2g4', 'g4', 3),
    });
    expect(third).toMatchObject({ uci: 'f2f4', results: { games: 1 } });
    expect(fourth.results).toBeNull();
    expect(result.current).toMatchObject({
      status: 'ready',
      totals: { games: 9, whiteWins: 9, draws: 0, blackWins: 0 },
      source: 'lichess',
      stale: true,
    });
  });

  it('asks about a position out of the book too', async () => {
    (getExplorer as jest.Mock).mockResolvedValue({
      source: 'masters',
      stale: false,
      totalGames: 2,
      whiteWins: 1,
      draws: 1,
      blackWins: 0,
      moves: [results('e3d3', 'Kd3', 2)],
    });
    const { result } = await renderHook(() =>
      useExplorerMoves('8/8/4k3/8/8/4K3/8/8 w - - 0 60', { db: 'masters' }),
    );
    await act(async () => {
      jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
    });

    expect(result.current.moves.map((move) => move.san)).toEqual(['Kd3']);
  });

  it("keeps the last position's moves, outdated, until the next one's come", async () => {
    const AFTER_NF3 =
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
    const answer = (uci: string, san: string) => ({
      source: 'lichess',
      stale: false,
      totalGames: 4,
      whiteWins: 4,
      draws: 0,
      blackWins: 0,
      moves: [results(uci, san, 4)],
    });
    let respond: (value: unknown) => void = () => {};
    (getExplorer as jest.Mock)
      .mockResolvedValueOnce(answer('g1f3', 'Nf3'))
      .mockReturnValueOnce(new Promise((resolve) => (respond = resolve)));
    const { result, rerender } = await renderHook(
      ({ fen }: { fen: string }) => useExplorerMoves(fen, LICHESS),
      { initialProps: { fen: AFTER_E4_E5 } },
    );
    await act(async () => {
      jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
    });
    expect(result.current).toMatchObject({ status: 'ready', outdated: false });

    await rerender({ fen: AFTER_NF3 });

    expect(result.current).toMatchObject({
      status: 'loading',
      outdated: true,
      fen: AFTER_E4_E5,
      totals: { games: 4 },
    });
    expect(result.current.moves[0]).toMatchObject({ san: 'Nf3' });

    await act(async () => {
      jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
    });
    await act(async () => respond(answer('b8c6', 'Nc6')));

    expect(result.current).toMatchObject({
      status: 'ready',
      outdated: false,
      fen: AFTER_NF3,
    });
    expect(result.current.moves[0]).toMatchObject({ san: 'Nc6' });
  });
});

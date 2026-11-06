import { act, renderHook } from '@testing-library/react-native';

import { useBookExplorer } from '../useBookExplorer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getExplorer } from '../../network/restClient';
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
const results = (uci: string, san: string, games: number) => ({
  uci,
  san,
  games,
  whiteWins: games,
  draws: 0,
  blackWins: 0,
});

describe('useBookExplorer', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });
  afterEach(() => jest.clearAllMocks());

  it('lists the book moves at once, then how each has done here, the most played first', async () => {
    let respond: (value: unknown) => void = () => {};
    (getExplorer as jest.Mock).mockReturnValue(
      new Promise((resolve) => (respond = resolve)),
    );
    const { result } = await renderHook(() => useBookExplorer(AFTER_E4_E5));

    expect(result.current.length).toBeGreaterThan(3);
    expect(result.current.every((move) => move.results === null)).toBe(true);

    await act(async () =>
      respond({
        totalGames: 9,
        moves: [
          results('g1f3', 'Nf3', 5),
          results('f2f4', 'f4', 3),
          // Played here, but not in the book.
          results('g2g4', 'g4', 1),
        ],
      }),
    );

    const [first, second, third] = result.current;
    expect(first).toMatchObject({
      uci: 'g1f3',
      opening: { name: "King's Knight Opening" },
      results: { games: 5 },
    });
    expect(second).toMatchObject({ uci: 'f2f4', results: { games: 3 } });
    expect(third.results).toBeNull();
    expect(result.current.some((move) => move.uci === 'g2g4')).toBe(false);
  });

  it('asks nothing for a position out of the book', async () => {
    const { result } = await renderHook(() =>
      useBookExplorer('8/8/4k3/8/8/4K3/8/8 w - - 0 60'),
    );

    expect(result.current).toEqual([]);
    expect(getExplorer).not.toHaveBeenCalled();
  });
});

import { act, fireEvent, render } from '@testing-library/react-native';

import Patterns from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import type { SideDigest } from '../../domain/review/digest';
import { getPatterns } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getPatterns: jest.fn(),
}));

const digest = (overrides: Partial<SideDigest> = {}): SideDigest => ({
  v: 1,
  accuracy: 80,
  result: 'win',
  opening: 'Italian Game',
  moves: 30,
  missedTactics: 2,
  slips: [
    {
      ply: 20,
      mark: '??',
      facts: ['allowsFork'],
      phase: 'middlegame',
      clockShare: 0.1,
    },
  ],
  accuracyByClock: { plenty: 88, short: 70 },
  accuracyByPhase: { opening: 92, middlegame: 75, endgame: null },
  marks: { '!!': 0, '!': 2, '?!': 1, '?': 0, '??': 1 },
  chances: { high: 80, low: 45 },
  ...overrides,
});

describe('Patterns', () => {
  async function renderPatterns() {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    const navigation = { navigate: jest.fn() };
    const screen = await render(
      <Patterns
        navigation={navigation as never}
        route={{ params: { username: 'judit' } } as never}
      />,
    );
    await act(async () => {});
    return { screen, navigation };
  }

  afterEach(() => jest.clearAllMocks());

  it('reads the month of reviewed games', async () => {
    (getPatterns as jest.Mock).mockResolvedValue({
      games: [
        { gameId: 'a', color: 'w', endedAt: '2026-11-02', digest: digest() },
        {
          gameId: 'b',
          color: 'b',
          endedAt: '2026-11-03',
          digest: digest({
            accuracy: 90,
            result: 'loss',
            chances: { high: 50, low: 20 },
          }),
        },
      ],
    });
    const { screen, navigation } = await renderPatterns();

    expect(getPatterns).toHaveBeenCalledWith('judit', '1m', 'access-token');
    expect(screen.getByTestId('patterns-games')).toHaveTextContent(/2/);
    expect(screen.getByTestId('patterns-accuracy')).toHaveTextContent(/85%/);
    expect(screen.getByTestId('patterns-results-w')).toHaveTextContent(
      'As white: 1W 0D 0L',
    );
    expect(screen.getByTestId('patterns-phase-opening')).toHaveTextContent(
      /92%/,
    );
    expect(screen.getByTestId('patterns-mark-!')).toHaveTextContent(/2\.0/);
    expect(screen.getByTestId('patterns-converting')).toHaveTextContent(
      'Won 1 of the 1 game you were winning (100%)',
    );
    expect(screen.getByTestId('patterns-saving')).toHaveTextContent(
      'Saved 0 of the 1 game you were losing (0%)',
    );
    expect(screen.getByTestId('patterns-time-trouble')).toHaveTextContent(
      /2 mistakes with under a quarter/,
    );

    await fireEvent.press(screen.getByTestId('patterns-practise-fork'));
    expect(navigation.navigate).toHaveBeenCalledWith('Puzzle', {
      deck: { deck: 'pool', theme: 'fork' },
    });
  });

  it('asks for another period from its tabs, and says when there are none', async () => {
    (getPatterns as jest.Mock).mockResolvedValue({ games: [] });
    const { screen } = await renderPatterns();

    expect(screen.getByTestId('patterns-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-1y'));
    await act(async () => {});
    expect(getPatterns).toHaveBeenLastCalledWith('judit', '1y', 'access-token');
  });
});

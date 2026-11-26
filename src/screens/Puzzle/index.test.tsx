import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { Square } from 'chess.js';

import Puzzle from '.';
import { PUZZLE_REPLY_MS, PUZZLE_SETUP_MS } from '../../constants/puzzles';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  attemptMyPuzzle,
  attemptPuzzle,
  getMyPuzzles,
  getNextPuzzle,
} from '../../network/restClient';
import { boardTester } from '../../components/Board/boardTester';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';
import { settleAnimations } from '../../testUtils/pieceGestures';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getNextPuzzle: jest.fn(),
  attemptPuzzle: jest.fn(),
  getMyPuzzles: jest.fn(),
  attemptMyPuzzle: jest.fn(),
}));

// Black's a7-a6 leaves the back rank open: Rd8 mates.
const POOL = {
  id: 'mate1',
  fen: '6k1/p4ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
  moves: ['a7a6', 'd1d8'],
  rating: 1200,
  themes: ['mateIn1'],
};

// Already white's move, the same mate.
const MINE = {
  id: '00000000-0000-0000-0000-000000000001',
  gameId: 'g1',
  ply: 30,
  fen: '6k1/5ppp/p7/8/8/8/5PPP/3R2K1 w - - 0 2',
  solution: ['d1d8'],
  themes: ['mateIn1'],
  dueAt: '2026-01-01T00:00:00.000Z',
  step: 0,
};

describe('Puzzle', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getNextPuzzle as jest.Mock).mockResolvedValue(POOL);
    (attemptPuzzle as jest.Mock).mockResolvedValue({
      ratingBefore: 1500,
      ratingAfter: 1508.6,
    });
    (getMyPuzzles as jest.Mock).mockResolvedValue({
      due: [MINE],
      dueCount: 1,
      learning: 0,
      mastered: 0,
    });
    (attemptMyPuzzle as jest.Mock).mockResolvedValue(MINE);
  });
  afterEach(() => jest.clearAllMocks());

  async function renderPuzzle(deck: object) {
    const navigation = { setOptions: jest.fn(), goBack: jest.fn() };
    const screen = await render(
      withSafeArea(
        <Puzzle
          navigation={navigation as never}
          route={{ params: { deck } } as never}
        />,
      ),
    );
    await act(async () => {});
    return { screen, navigation };
  }

  async function playSetup() {
    await act(async () => {
      jest.advanceTimersByTime(PUZZLE_SETUP_MS);
    });
    await settleAnimations();
  }

  async function playMove(
    screen: Awaited<ReturnType<typeof renderPuzzle>>['screen'],
    from: Square,
    to: Square,
  ) {
    await boardTester(screen, 'review').drag(from, to);
    await act(async () => {
      jest.advanceTimersByTime(PUZZLE_REPLY_MS);
    });
    await settleAnimations();
  }

  it('plays the opponent move, then asks for yours', async () => {
    const { screen, navigation } = await renderPuzzle({ deck: 'pool' });
    await playSetup();

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Practice' });
    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent(
      'White to move: find the best line.',
    );
  });

  it('solves a pool puzzle and moves your rating', async () => {
    const { screen } = await renderPuzzle({ deck: 'pool', theme: 'mateIn1' });
    await playSetup();

    await playMove(screen, 'd1', 'd8');

    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent('Solved!');
    expect(attemptPuzzle).toHaveBeenCalledWith('mate1', true, 'access-token');
    expect(screen.getByTestId('puzzle-rating-change')).toHaveTextContent(
      /1509\s*\+9/,
    );
  });

  it('misses with a wrong move, and offers a retry', async () => {
    const { screen } = await renderPuzzle({ deck: 'pool' });
    await playSetup();

    await playMove(screen, 'd1', 'd7');

    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent(
      "Rd7 isn't it.",
    );
    expect(attemptPuzzle).toHaveBeenCalledWith('mate1', false, 'access-token');
    await fireEvent.press(screen.getByTestId('puzzle-retry'));
    await playSetup();
    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent(
      /White to move/,
    );
  });

  it('puts your own puzzle back on its schedule, then says you are done', async () => {
    const { screen, navigation } = await renderPuzzle({ deck: 'mine' });

    expect(navigation.setOptions).toHaveBeenCalledWith({
      title: 'From your games',
    });
    await playMove(screen, 'd1', 'd8');

    expect(attemptMyPuzzle).toHaveBeenCalledWith(MINE.id, true, 'access-token');
    await fireEvent.press(screen.getByTestId('puzzle-next'));
    expect(screen.getByTestId('puzzle-done')).toHaveTextContent(
      /All caught up/,
    );
  });

  it('says when the pool has nothing left', async () => {
    (getNextPuzzle as jest.Mock).mockResolvedValue(null);
    const { screen } = await renderPuzzle({ deck: 'pool' });

    expect(screen.getByTestId('puzzle-done')).toHaveTextContent(
      /No puzzles left here/,
    );
  });

  it('hints at the next move with an arrow, counting the puzzle as missed', async () => {
    const { screen } = await renderPuzzle({ deck: 'pool' });
    await playSetup();

    await fireEvent.press(screen.getByTestId('puzzle-hint'));
    await act(async () => {});

    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent(
      'The arrow shows the next move.',
    );
    expect(attemptPuzzle).toHaveBeenCalledWith('mate1', false, 'access-token');
    await playMove(screen, 'd1', 'd8');
    expect(screen.getByTestId('puzzle-prompt')).toHaveTextContent(
      'Solved, with a hint.',
    );
  });

  it('steps back to the start and forward again', async () => {
    const { screen } = await renderPuzzle({ deck: 'pool' });
    await playSetup();
    const board = boardTester(screen, 'review');
    expect(board.pieceOn('a6')).toBe('bp');

    await fireEvent.press(screen.getByTestId('puzzle-back'));
    await settleAnimations();
    expect(board.pieceOn('a7')).toBe('bp');
    expect(screen.getByTestId('puzzle-forward')).toBeEnabled();

    await fireEvent.press(screen.getByTestId('puzzle-forward'));
    await settleAnimations();
    expect(board.pieceOn('a6')).toBe('bp');
  });

  it('gives back the practice puzzle left unfinished', async () => {
    const first = await renderPuzzle({ deck: 'pool', theme: 'mateIn1' });
    await playSetup();
    await first.screen.unmount();
    (getNextPuzzle as jest.Mock).mockResolvedValue({ ...POOL, id: 'other' });

    const again = await renderPuzzle({ deck: 'pool', theme: 'mateIn1' });
    await playSetup();
    await playMove(again.screen, 'd1', 'd8');

    expect(getNextPuzzle).toHaveBeenCalledTimes(1);
    expect(attemptPuzzle).toHaveBeenCalledWith('mate1', true, 'access-token');
  });

  it('gives a new one once the last was tried', async () => {
    const first = await renderPuzzle({ deck: 'pool' });
    await playSetup();
    await playMove(first.screen, 'd1', 'd8');
    await act(async () => {});
    await first.screen.unmount();

    await renderPuzzle({ deck: 'pool' });
    expect(getNextPuzzle).toHaveBeenCalledTimes(2);
  });
});

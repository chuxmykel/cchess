import { act, fireEvent, render } from '@testing-library/react-native';

import Puzzles from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { patternsOf } from '../../domain/review/patterns';
import {
  getMyPuzzles,
  getPatterns,
  getPuzzleRating,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyPuzzles: jest.fn(),
  getPuzzleRating: jest.fn(),
  getPatterns: jest.fn(),
}));
jest.mock('../../domain/review/patterns', () => ({
  patternsOf: jest.fn(),
}));

const MINE = { due: [], dueCount: 3, learning: 2, mastered: 1 };

describe('Puzzles', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getMyPuzzles as jest.Mock).mockResolvedValue(MINE);
    (getPuzzleRating as jest.Mock).mockResolvedValue({
      rating: 1512.4,
      deviation: 120,
      attempts: 9,
    });
    (getPatterns as jest.Mock).mockResolvedValue({ games: [], badges: {} });
    (patternsOf as jest.Mock).mockReturnValue({
      weakThemes: [{ theme: 'fork', count: 3 }],
    });
  });
  afterEach(() => jest.clearAllMocks());

  async function renderHome() {
    const navigation = { navigate: jest.fn() };
    const screen = await render(
      <Puzzles navigation={navigation as never} route={{} as never} />,
    );
    await act(async () => {});
    return { screen, navigation };
  }

  it('shows your own deck and your puzzle rating', async () => {
    const { screen } = await renderHome();

    expect(screen.getByTestId('puzzles-mine-due')).toHaveTextContent('3');
    expect(screen.getByTestId('puzzles-mine-learning')).toHaveTextContent('2');
    expect(screen.getByTestId('puzzles-mine-mastered')).toHaveTextContent('1');
    expect(screen.getByTestId('puzzle-rating')).toHaveTextContent('1512');
  });

  it('opens your due puzzles', async () => {
    const { screen, navigation } = await renderHome();

    await fireEvent.press(screen.getByTestId('puzzles-mine-start'));

    expect(navigation.navigate).toHaveBeenCalledWith('Puzzle', {
      deck: { deck: 'mine' },
    });
  });

  it('says when none are due', async () => {
    (getMyPuzzles as jest.Mock).mockResolvedValue({ ...MINE, dueCount: 0 });
    const { screen } = await renderHome();

    expect(screen.queryByTestId('puzzles-mine-start')).toBeNull();
    expect(screen.getByTestId('puzzles-mine-none')).toHaveTextContent(
      /Nothing due today/,
    );
  });

  it('suggests the themes your games slip on, first', async () => {
    const { screen, navigation } = await renderHome();

    await fireEvent.press(screen.getByTestId('puzzle-theme-fork'));

    expect(navigation.navigate).toHaveBeenCalledWith('Puzzle', {
      deck: { deck: 'pool', theme: 'fork' },
    });
    // Offered once, among the suggested.
    expect(screen.getAllByTestId('puzzle-theme-fork')).toHaveLength(1);
  });

  it('practises from the pool at any theme', async () => {
    const { screen, navigation } = await renderHome();

    await fireEvent.press(screen.getByTestId('puzzles-practice-start'));

    expect(navigation.navigate).toHaveBeenCalledWith('Puzzle', {
      deck: { deck: 'pool', theme: undefined },
    });
  });

  it('says when it could not load', async () => {
    (getMyPuzzles as jest.Mock).mockRejectedValue(new Error('down'));
    const { screen } = await renderHome();

    expect(screen.getByTestId('puzzles-error')).toBeTruthy();
  });
});

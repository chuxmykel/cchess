import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import OpeningExplorer from '.';
import { boardTester } from '../../components/Board/boardTester';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getExplorer } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getExplorer: jest.fn(),
}));

describe('OpeningExplorer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
    (getExplorer as jest.Mock).mockResolvedValue({
      totalGames: 4,
      moves: [
        {
          san: 'Nf3',
          uci: 'g1f3',
          games: 4,
          whiteWins: 2,
          draws: 1,
          blackWins: 1,
        },
      ],
    });
    return AsyncStorage.clear();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  async function renderExplorer() {
    let beforeRemove = () => {};
    const navigation = {
      addListener: jest.fn((event: string, listener: () => void) => {
        if (event === 'beforeRemove') beforeRemove = listener;
        return () => {};
      }),
      dispatch: jest.fn(),
    };
    const screen = await render(
      withSafeArea(
        <AnalysisSettingsProvider>
          <OpeningExplorer
            navigation={navigation as never}
            route={
              {
                key: 'explorer',
                name: 'OpeningExplorer',
                params: {
                  startFen: DEFAULT_POSITION,
                  uciMoves: ['e2e4', 'e7e5'],
                  orientation: 'w',
                  returnKey: 'analysis-route',
                },
              } as never
            }
          />
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    return { screen, navigation, leave: () => beforeRemove() };
  }

  it("shows the position it's opened on, its opening, and the book's moves from it", async () => {
    const { screen } = await renderExplorer();

    expect(boardTester(screen).pieceOn('e5')).toBe('bp');
    expect(screen.getByTestId('opening-name')).toHaveTextContent(
      "C20 · King's Pawn Game",
    );
    expect(screen.getByTestId('explorer-move-f2f4')).toHaveTextContent(
      "f4King's Gambit",
    );
    expect(screen.queryByTestId('explorer-move-g2g4')).toBeNull();
  });

  it('puts the moves played in games here first, with how they went', async () => {
    const { screen } = await renderExplorer();

    expect(getExplorer).toHaveBeenCalledWith(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'token-a',
    );
    const rows = screen.getAllByTestId(/^explorer-move-/);
    expect(rows[0].props.testID).toBe('explorer-move-g1f3');
    expect(screen.getByTestId('explorer-results-g1f3')).toHaveTextContent(
      /^4 games/,
    );
  });

  it("plays a move tapped on its own board, and lists the next position's", async () => {
    const { screen } = await renderExplorer();

    await fireEvent.press(screen.getByTestId('explorer-move-g1f3'));
    await settleAnimations();
    await act(async () => {});

    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
    expect(screen.getByTestId('explorer-move-b8c6')).toBeTruthy();
  });

  it('hands the line explored back to the analysis on leaving', async () => {
    const { screen, navigation, leave } = await renderExplorer();
    await fireEvent.press(screen.getByTestId('explorer-move-g1f3'));
    await settleAnimations();

    leave();

    expect(navigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_PARAMS',
        source: 'analysis-route',
        payload: {
          params: {
            explorerLine: {
              startFen: DEFAULT_POSITION,
              uciMoves: ['e2e4', 'e7e5', 'g1f3'],
            },
          },
        },
      }),
    );
  });
});

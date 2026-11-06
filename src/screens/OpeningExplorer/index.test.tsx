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

  async function renderExplorer(uciMoves = ['e2e4', 'e7e5']) {
    const navigation = { dispatch: jest.fn() };
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
                  uciMoves,
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
    return { screen, navigation };
  }

  it("shows the moves played, the opening, and the book's moves numbered", async () => {
    const { screen } = await renderExplorer();

    expect(boardTester(screen).pieceOn('e5')).toBe('bp');
    expect(screen.getByTestId('move-1')).toHaveTextContent('e4');
    expect(screen.getByTestId('move-2')).toHaveTextContent('e5');
    expect(screen.getByTestId('explorer-opening')).toHaveTextContent(
      "King's Pawn Game",
    );
    expect(screen.getByTestId('explorer-move-f2f4')).toHaveTextContent(
      /^2\. f4/,
    );
    expect(screen.queryByText("King's Gambit")).toBeNull();
    expect(screen.queryByTestId('explorer-move-g2g4')).toBeNull();
  });

  it('says so once out of the book', async () => {
    const { screen } = await renderExplorer(['e2e4', 'e7e5', 'g2g4', 'g7g5']);

    expect(screen.getByTestId('explorer-empty')).toHaveTextContent(
      'No results',
    );
  });

  it('puts the moves played in games here first, with how they went', async () => {
    const { screen } = await renderExplorer();

    expect(getExplorer).toHaveBeenCalledWith(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'token-a',
    );
    const rows = screen.getAllByTestId(/^explorer-move-/);
    expect(rows[0].props.testID).toBe('explorer-move-g1f3');
    expect(screen.getByTestId('explorer-games-g1f3')).toHaveTextContent('4');
    expect(screen.getByTestId('explorer-games-f2f4')).toHaveTextContent('0');
  });

  it("plays a move tapped on its own board, and lists the next position's", async () => {
    const { screen } = await renderExplorer();

    await fireEvent.press(screen.getByTestId('explorer-move-g1f3'));
    await settleAnimations();
    await act(async () => {});

    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
    expect(screen.getByTestId('explorer-move-b8c6')).toBeTruthy();
  });

  it('keeps the analysis it came from on the line explored', async () => {
    const { screen, navigation } = await renderExplorer();
    await fireEvent.press(screen.getByTestId('explorer-move-g1f3'));
    await settleAnimations();

    expect(navigation.dispatch).toHaveBeenLastCalledWith(
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

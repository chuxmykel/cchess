import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import OpeningExplorer from '.';
import { boardTester } from '../../components/Board/boardTester';
import {
  DEFAULT_EXPLORER_SETTINGS,
  EXPLORER_FETCH_DELAY_MS,
} from '../../constants/explorer';
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
      source: 'lichess',
      stale: false,
      totalGames: 4,
      whiteWins: 2,
      draws: 1,
      blackWins: 1,
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

  const waitOutDelay = () =>
    act(async () => {
      jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
    });

  async function renderExplorer(
    uciMoves = ['e2e4', 'e7e5'],
    // null: opened on its own, with no analysis behind it.
    returnKey: string | null = 'analysis-route',
  ) {
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
                  returnKey: returnKey ?? undefined,
                },
              } as never
            }
          />
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    await waitOutDelay();
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

  it('says so when no one has played on from a position out of the book', async () => {
    (getExplorer as jest.Mock).mockResolvedValue({
      source: 'lichess',
      stale: false,
      totalGames: 0,
      whiteWins: 0,
      draws: 0,
      blackWins: 0,
      moves: [],
    });
    const { screen } = await renderExplorer(['e2e4', 'e7e5', 'g2g4', 'g7g5']);

    expect(screen.getByTestId('explorer-empty')).toHaveTextContent(
      'No results',
    );
  });

  it("puts the database's moves first, with how they went", async () => {
    const { screen } = await renderExplorer();

    expect(getExplorer).toHaveBeenCalledWith(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'token-a',
      {
        db: 'lichess',
        speeds: DEFAULT_EXPLORER_SETTINGS.speeds,
        ratings: DEFAULT_EXPLORER_SETTINGS.ratings,
      },
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
    await waitOutDelay();

    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
    expect(screen.getByTestId('explorer-move-b8c6')).toBeTruthy();
  });

  it('asks in the database chosen, and remembers it', async () => {
    const { screen } = await renderExplorer();
    expect(
      screen.getByTestId('explorer-database-button-caption'),
    ).toHaveTextContent('Lichess');

    await fireEvent.press(screen.getByTestId('explorer-database-button'));
    await fireEvent.press(screen.getByTestId('explorer-db-masters'));
    await waitOutDelay();

    expect(getExplorer).toHaveBeenLastCalledWith(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'token-a',
      { db: 'masters' },
    );
    expect(
      screen.getByTestId('explorer-database-button-caption'),
    ).toHaveTextContent('Masters');

    await screen.unmount();
    const again = await renderExplorer();
    expect(
      again.screen.getByTestId('explorer-database-button-caption'),
    ).toHaveTextContent('Masters');
  });

  it('looks in your own games in the Player database', async () => {
    const { screen } = await renderExplorer();

    await fireEvent.press(screen.getByTestId('explorer-database-button'));
    await fireEvent.press(screen.getByTestId('explorer-db-player'));
    await waitOutDelay();

    expect((getExplorer as jest.Mock).mock.lastCall[2]).toEqual({
      db: 'player',
      user: 'user-1', // makeAuthSession's own
      color: 'white',
    });
  });

  it('says when lichess was out of reach', async () => {
    (getExplorer as jest.Mock).mockResolvedValue({
      source: 'cchess',
      stale: false,
      totalGames: 0,
      whiteWins: 0,
      draws: 0,
      blackWins: 0,
      moves: [],
    });
    const { screen } = await renderExplorer();

    expect(screen.getByTestId('explorer-fallback')).toHaveTextContent(
      /^Lichess is out of reach/,
    );
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

  it('stands alone when opened from the Menu, handing no line back', async () => {
    const { screen, navigation } = await renderExplorer([], null);

    expect(boardTester(screen).pieceOn('e2')).toBe('wp');
    expect(navigation.dispatch).not.toHaveBeenCalled();
  });
});

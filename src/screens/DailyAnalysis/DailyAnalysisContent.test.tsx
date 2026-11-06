import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import DailyAnalysisContent from './DailyAnalysisContent';
import { boardTester } from '../../components/Board/boardTester';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { EngineContext } from '../../context/EngineContext';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { ExplorerLine } from '../../hooks/useExplorerLine';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

const PLAYERS = {
  white: makeGameSnapshot().white,
  black: makeGameSnapshot().black,
};

describe('DailyAnalysisContent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        accessToken: 'token-a',
        socket: createFakeSocket().socket,
      }),
    );
    return AsyncStorage.clear();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  async function renderAnalysis({
    uciMoves = ['e2e4', 'e7e5'],
    explorerLine,
    gameMoves,
  }: {
    uciMoves?: string[];
    /** The game's moves now, if it's moved on since. */
    gameMoves?: string[];
    explorerLine?: ExplorerLine;
  } = {}) {
    const acquire = jest.fn(() => () => {});
    const onReset = jest.fn();
    const onOpenNotes = jest.fn();
    const onOpenExplorer = jest.fn();
    const onExplorerLineTaken = jest.fn();
    const screen = await render(
      withSafeArea(
        <AnalysisSettingsProvider>
          <EngineContext.Provider
            value={{ status: { kind: 'idle' }, acquire, retry: jest.fn() }}
          >
            <DailyAnalysisContent
              start={{ startFen: DEFAULT_POSITION, uciMoves }}
              gameStart={{
                startFen: DEFAULT_POSITION,
                uciMoves: gameMoves ?? uciMoves,
              }}
              players={PLAYERS}
              initialOrientation="w"
              width={400}
              onReset={onReset}
              onOpenNotes={onOpenNotes}
              onOpenExplorer={onOpenExplorer}
              explorerLine={explorerLine}
              onExplorerLineTaken={onExplorerLineTaken}
            />
          </EngineContext.Provider>
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    return {
      screen,
      acquire,
      onReset,
      onOpenNotes,
      onOpenExplorer,
      onExplorerLineTaken,
    };
  }

  it('analyses with no engine at all', async () => {
    const { screen, acquire } = await renderAnalysis();

    expect(acquire).not.toHaveBeenCalled();
    expect(screen.queryByTestId('engine-lines-area')).toBeNull();
    expect(screen.queryByTestId('eval-bar')).toBeNull();
  });

  it('shows the game as it is played, the players either side and no clocks', async () => {
    const { screen } = await renderAnalysis();

    expect(screen.getByTestId('player-name-w')).toHaveTextContent('White');
    expect(screen.getByTestId('player-name-b')).toHaveTextContent('Black');
    expect(screen.queryByTestId(/^game-clock/)).toBeNull();
    expect(screen.getByTestId('move-1')).toHaveTextContent('e4');
    expect(screen.getByTestId('move-2')).toHaveTextContent('e5');
    expect(screen.queryByTestId('opening-name')).toBeNull();
  });

  it('keeps one line, a different move replacing the moves after it', async () => {
    const { screen } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('previous-move-button'));
    await settleAnimations();
    await boardTester(screen).taps('c7', 'c5');
    await settleAnimations();

    expect(screen.getByTestId('move-2')).toHaveTextContent('c5');
    expect(screen.queryByTestId('move-3')).toBeNull();
    expect(screen.queryByText('e5')).toBeNull();
  });

  it('has the explorer, notes, flip, reset and the steps in its toolbar', async () => {
    const { screen } = await renderAnalysis();

    for (const button of [
      'opening-explorer-button',
      'notes-button',
      'flip-board-button',
      'reset-analysis-button',
      'previous-move-button',
      'next-move-button',
    ]) {
      expect(screen.getByTestId(button)).toBeTruthy();
    }
  });

  it('opens the opening explorer on the line to the position shown', async () => {
    const { screen, onOpenExplorer } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('previous-move-button'));
    await settleAnimations();
    await fireEvent.press(screen.getByTestId('opening-explorer-button'));

    expect(onOpenExplorer).toHaveBeenCalledWith(
      { startFen: DEFAULT_POSITION, uciMoves: ['e2e4'] },
      'w',
    );
  });

  it('goes along the line the explorer hands back, replacing what followed', async () => {
    const { screen, onExplorerLineTaken } = await renderAnalysis({
      explorerLine: {
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'c7c5', 'g1f3'],
      },
    });
    await settleAnimations();

    expect(screen.getByTestId('move-2')).toHaveTextContent('c5');
    expect(screen.getByTestId('move-3')).toHaveTextContent('Nf3');
    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
    expect(onExplorerLineTaken).toHaveBeenCalled();
  });

  it('resets to the game as it now stands, in place, the board turned as it was', async () => {
    const { screen, onReset } = await renderAnalysis({
      gameMoves: ['e2e4', 'e7e5', 'g1f3'],
    });
    await boardTester(screen).taps('d2', 'd4');
    await settleAnimations();
    await fireEvent.press(screen.getByTestId('flip-board-button'));

    await fireEvent.press(screen.getByTestId('reset-analysis-button'));
    await settleAnimations();

    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
    expect(boardTester(screen).pieceOn('d4')).toBeNull();
    expect(screen.getByTestId('move-3')).toHaveTextContent('Nf3');
    expect(boardTester(screen).orientation()).toBe('b');
    expect(onReset).toHaveBeenCalled();
  });

  it("leaves the board alone when it's at the game's position already", async () => {
    const { screen } = await renderAnalysis();
    const board = screen.getByTestId('chessboard');

    await fireEvent.press(screen.getByTestId('reset-analysis-button'));

    expect(screen.getByTestId('chessboard')).toBe(board);
    expect(boardTester(screen).pieceOn('e5')).toBe('bp');
  });

  it('opens your notes on the game', async () => {
    const { screen, onOpenNotes } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('notes-button'));

    expect(onOpenNotes).toHaveBeenCalled();
  });
});

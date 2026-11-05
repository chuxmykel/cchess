import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import DailyAnalysisContent from './DailyAnalysisContent';
import { boardTester } from '../../components/Board/boardTester';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { EngineContext } from '../../context/EngineContext';
import { NOTES_SAVE_DELAY_MS } from '../../hooks/useGameNotes';
import {
  getExplorer,
  getGameNotes,
  saveGameNotes,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getExplorer: jest.fn(),
  getGameNotes: jest.fn(),
  saveGameNotes: jest.fn(),
}));

describe('DailyAnalysisContent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
    (getGameNotes as jest.Mock).mockResolvedValue({
      body: 'Push the h-pawn',
      updatedAt: null,
    });
    (saveGameNotes as jest.Mock).mockResolvedValue({
      body: '',
      updatedAt: null,
    });
    (getExplorer as jest.Mock).mockResolvedValue({
      totalGames: 12,
      moves: [
        {
          san: 'Nf3',
          uci: 'g1f3',
          games: 8,
          whiteWins: 4,
          draws: 2,
          blackWins: 2,
        },
      ],
    });
    return AsyncStorage.clear();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  async function renderAnalysis() {
    const acquire = jest.fn(() => () => {});
    const onReset = jest.fn();
    const screen = await render(
      withSafeArea(
        <AnalysisSettingsProvider>
          <EngineContext.Provider
            value={{ status: { kind: 'idle' }, acquire, retry: jest.fn() }}
          >
            <DailyAnalysisContent
              gameId="game-1"
              start={{ startFen: DEFAULT_POSITION, uciMoves: ['e2e4', 'e7e5'] }}
              initialOrientation="w"
              width={400}
              onReset={onReset}
            />
          </EngineContext.Provider>
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    return { screen, acquire, onReset };
  }

  it('analyses with no engine at all', async () => {
    const { screen, acquire } = await renderAnalysis();

    expect(acquire).not.toHaveBeenCalled();
    expect(screen.queryByTestId('engine-lines-area')).toBeNull();
    expect(screen.queryByTestId('eval-bar')).toBeNull();
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

  it("lists the explorer's moves from the position shown, a tap playing one", async () => {
    const { screen } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('opening-explorer-button'));
    await act(async () => {});

    expect(getExplorer).toHaveBeenCalledWith(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'token-a',
    );
    expect(screen.getByText('12 games')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('explorer-move-g1f3'));
    await settleAnimations();

    expect(boardTester(screen).pieceOn('f3')).toBe('wn');
  });

  it('flips the board, and resets to the game', async () => {
    const { screen, onReset } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('flip-board-button'));
    expect(boardTester(screen).orientation()).toBe('b');

    await fireEvent.press(screen.getByTestId('reset-analysis-button'));
    expect(onReset).toHaveBeenCalled();
  });

  it('keeps your notes, saving them once you stop typing', async () => {
    const { screen } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('notes-button'));
    expect(screen.getByTestId('notes-input').props.value).toBe(
      'Push the h-pawn',
    );
    await fireEvent.changeText(
      screen.getByTestId('notes-input'),
      'Push the h-pawn, then castle long',
    );
    expect(saveGameNotes).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(NOTES_SAVE_DELAY_MS));

    expect(saveGameNotes).toHaveBeenCalledWith(
      'game-1',
      'Push the h-pawn, then castle long',
      'token-a',
    );
  });

  it('saves what was typed as the notes close', async () => {
    const { screen } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('notes-button'));
    await fireEvent.changeText(
      screen.getByTestId('notes-input'),
      'Trade queens',
    );
    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));

    expect(saveGameNotes).toHaveBeenCalledWith(
      'game-1',
      'Trade queens',
      'token-a',
    );
  });
});
